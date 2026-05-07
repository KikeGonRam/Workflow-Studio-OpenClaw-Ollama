import { useState, useEffect } from "react";
import "./App.css";
import { HistoryView } from "./HistoryView";
import { StatsView } from "./StatsView";
import { SettingsView } from "./SettingsView";
import { useWebSocket } from "./hooks.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const defaultChallenge =
  "Quiero escalar mi marca digital con automatizaciones semanales de contenido, leads y seguimiento comercial.";

const TABS = {
  dashboard: "Dashboard",
  history: "Historial",
  stats: "Estadísticas",
  settings: "Configuración",
};

function DashboardTab() {
  const [challenge, setChallenge] = useState(defaultChallenge);
  const [audience, setAudience] = useState("fundadores y equipos de growth");
  const [tone, setTone] = useState("ejecutivo");
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);

  const { status: wsStatus, isConnected } = useWebSocket();

  useEffect(() => {
    if (wsStatus) setStatus(wsStatus);
  }, [wsStatus]);

  const statusSummary = (() => {
    if (!status) return "Aún no verificado";
    const ollamaStatus = status.ollama?.online ? "🟢 Ollama" : "🔴 Ollama";
    const openclawStatus = status.openclaw?.online ? "🟢 OpenClaw" : "🔴 OpenClaw";
    return `${ollamaStatus} · ${openclawStatus}`;
  })();

  const checkIntegrations = async () => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/integrations/status`);
      if (!res.ok) throw new Error("Error verificando integraciones");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setError(`No se pudo consultar integraciones: ${e.message}`);
    }
  };

  const generateStrategy = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/ai/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, audience, tone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error desconocido");
      }
      setStrategy(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="hero">
        <span className="badge">✨ OpenClaw + Ollama + Workflow Studio</span>
        <h1>Professional AI Studio</h1>
        <p>
          Fullstack dockerizado para estrategia de negocio, automatizaciones y
          operación asistida por IA local. Versión 2.0 con historial, gráficos y
          exportación.
        </p>
        {isConnected && (
          <span className="badge" style={{ marginLeft: "1rem" }}>
            🔌 WebSocket conectado
          </span>
        )}
      </header>

      <section className="grid">
        <article className="card">
          <h2>🔌 Integraciones en tiempo real</h2>
          <p style={{ marginBottom: "1rem" }}>{statusSummary}</p>
          <button onClick={checkIntegrations} type="button">
            {status ? "Actualizar estado" : "Verificar estado"}
          </button>
          {status && (
            <div className="status">
              <h3>Detalles</h3>
              <p>
                <strong>Modelo:</strong>{" "}
                {status.ollama?.model || "No disponible"}
              </p>
              <p>
                <strong>Ollama:</strong>{" "}
                {status.ollama?.detail || "Sin información"}
              </p>
              <p>
                <strong>OpenClaw:</strong>{" "}
                {status.openclaw?.detail || "Sin información"}
              </p>
            </div>
          )}
          {error && <p className="error">{error}</p>}
        </article>

        <article className="card">
          <h2>⚡ Capacidades del stack</h2>
          <ul>
            <li>✓ Generación de estrategias con IA local</li>
            <li>✓ Historial con búsqueda y filtros</li>
            <li>✓ Gráficos de estadísticas (30 días)</li>
            <li>✓ Exportar a PDF y JSON</li>
            <li>✓ 6 temas personalizables</li>
            <li>✓ WebSocket en tiempo real</li>
          </ul>
        </article>
      </section>

      <section className="card strategy">
        <h2>🎯 Generador de estrategia IA</h2>
        <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Describe tu reto, audiencia y tono. La IA generará una estrategia
          personalizada.
        </p>
        <form onSubmit={generateStrategy}>
          <label>
            <span>📝 Reto de negocio</span>
            <textarea
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="Describe el reto que quieres resolver..."
              required
            />
          </label>
          <div className="row">
            <label>
              <span>👥 Audiencia objetivo</span>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="ej: empresarios, estudiantes, emprendedores..."
                required
              />
            </label>
            <label>
              <span>🎙️ Tono de comunicación</span>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="ejecutivo">Ejecutivo / Profesional</option>
                <option value="tecnico">Técnico / Especializado</option>
                <option value="comercial">Comercial / Persuasivo</option>
                <option value="creativo">Creativo / Innovador</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Generando estrategia..." : "🚀 Generar propuesta"}
          </button>
        </form>
        {error && <p className="error">⚠️ {error}</p>}
        {strategy && (
          <div>
            <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
              📊 Propuesta generada
            </h3>
            <pre className="output" aria-label="Propuesta IA">
              {strategy}
            </pre>
          </div>
        )}
      </section>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      const preferred = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      return saved || preferred;
    }
    return "dark";
  });

  const [activeTab, setActiveTab] = useState("dashboard");

  // Apply theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", "light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "history":
        return <HistoryView />;
      case "stats":
        return <StatsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <main className="page">
        <nav className="nav-tabs">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              className={`nav-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {renderTab()}

        <footer
          style={{
            marginTop: "3rem",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <p>
            Construido con OpenClaw, Ollama y React • Docker Compose • {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </>
  );
}

export default App;
