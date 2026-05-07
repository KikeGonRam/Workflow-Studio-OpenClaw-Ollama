import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import {
  db_save_strategy,
  db_get_strategies,
  db_get_strategy,
  db_delete_strategy,
  db_count_strategies,
  db_get_stats,
} from "./database.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";
const OPENCLAW_BASE = process.env.OPENCLAW_DASHBOARD_URL || "http://host.docker.internal:18789";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
const TIMEOUT = 25000;

// Helper: Timeout wrapper
function withTimeout(ms = TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// Helper: Check Ollama
async function checkOllama() {
  const timeout = withTimeout(6000);
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: timeout.signal });
    if (!res.ok) {
      return { online: false, detail: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return {
      online: true,
      detail: "Connected",
      model: MODEL,
      models,
    };
  } catch (error) {
    return { online: false, detail: error.message };
  } finally {
    timeout.clear();
  }
}

// Helper: Check OpenClaw
async function checkOpenClaw() {
  const timeout = withTimeout(6000);
  try {
    const res = await fetch(OPENCLAW_BASE, { signal: timeout.signal });
    return {
      online: res.ok,
      detail: res.ok ? "Dashboard reachable" : `HTTP ${res.status}`,
      dashboardUrl: OPENCLAW_BASE,
    };
  } catch (error) {
    return { online: false, detail: error.message };
  } finally {
    timeout.clear();
  }
}

// Helper: Generate strategy with Ollama
async function generateStrategy(challenge, audience, tone) {
  const timeout = withTimeout();
  try {
    const prompt = [
      `Reto: ${challenge.trim()}`,
      `Audiencia objetivo: ${audience}`,
      `Tono: ${tone}`,
      "Entrega una propuesta con:",
      "1) Diagnóstico breve",
      "2) Arquitectura recomendada (frontend, backend, datos, IA)",
      "3) Roadmap 30-60-90 días",
      "4) Automatizaciones de alto impacto",
      "5) Riesgos y mitigaciones",
      "6) Próximos 3 pasos ejecutables hoy",
    ].join("\n");

    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: timeout.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: { temperature: 0.7 },
        messages: [
          {
            role: "system",
            content:
              "You are a senior digital product strategist. Respond in concise, professional Spanish with sections and actionable bullets.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = await res.json();
    const message = data?.message?.content?.trim();
    if (!message) {
      throw new Error("Ollama returned empty content");
    }

    return message;
  } finally {
    timeout.clear();
  }
}

// WebSocket connection handler
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send initial status
  (async () => {
    const [ollama, openclaw] = await Promise.all([checkOllama(), checkOpenClaw()]);
    socket.emit("status:update", { ollama, openclaw });
  })();

  // Periodic status updates (every 5 seconds)
  const statusInterval = setInterval(async () => {
    const [ollama, openclaw] = await Promise.all([checkOllama(), checkOpenClaw()]);
    socket.emit("status:update", { ollama, openclaw });
  }, 5000);

  socket.on("disconnect", () => {
    clearInterval(statusInterval);
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// REST Endpoints

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "openclaw-ollama-backend",
    time: new Date().toISOString(),
    model: MODEL,
  });
});

// Integration status
app.get("/api/integrations/status", async (_req, res) => {
  const [ollama, openclaw] = await Promise.all([checkOllama(), checkOpenClaw()]);
  res.json({ ollama, openclaw });
});

// Generate strategy (with persistence)
app.post("/api/ai/strategy", async (req, res) => {
  const { challenge, audience = "emprendedores", tone = "ejecutivo" } = req.body || {};

  if (!challenge || typeof challenge !== "string" || challenge.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      error: "El campo 'challenge' debe tener al menos 10 caracteres.",
    });
  }

  try {
    // Notify clients: generating
    io.emit("strategy:generating", { challenge, audience, tone });

    const content = await generateStrategy(challenge, audience, tone);

    // Save to database
    const id = db_save_strategy(challenge, audience, tone, content);

    // Notify clients: generated
    io.emit("strategy:generated", {
      id,
      challenge,
      audience,
      tone,
      content,
      created_at: new Date().toISOString(),
    });

    res.json({ ok: true, id, content, timestamp: new Date().toISOString() });
  } catch (error) {
    io.emit("strategy:error", { error: error.message });
    res.status(502).json({
      ok: false,
      error: "No se pudo obtener respuesta de Ollama.",
      detail: error.message,
    });
  }
});

// List all strategies (paginated)
app.get("/api/strategies", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const strategies = await db_get_strategies(limit, offset);
    const total = await db_count_strategies();

    res.json({
      ok: true,
      data: strategies || [],
      pagination: { limit, offset, total },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get single strategy
app.get("/api/strategies/:id", async (req, res) => {
  try {
    const strategy = await db_get_strategy(req.params.id);
    if (!strategy) {
      return res.status(404).json({ ok: false, error: "Strategy not found" });
    }
    res.json({ ok: true, data: strategy });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Delete strategy
app.delete("/api/strategies/:id", async (req, res) => {
  try {
    const deleted = await db_delete_strategy(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Strategy not found" });
    }

    // Notify clients
    io.emit("strategy:deleted", { id: req.params.id });

    res.json({ ok: true, message: "Strategy deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get statistics
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db_get_stats();
    res.json({ ok: true, data: stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`\n◇ Backend listening on http://0.0.0.0:${PORT}`);
  console.log(`  WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`  Ollama: ${OLLAMA_BASE}`);
  console.log(`  OpenClaw: ${OPENCLAW_BASE}`);
  console.log("");
});
