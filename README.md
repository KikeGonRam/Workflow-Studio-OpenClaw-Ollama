# OpenClaw Ollama Studio

Sitio web profesional fullstack dockerizado para demostrar lo que puedes construir con **Ollama + OpenClaw + IA aplicada**.

## Stack

- **Frontend:** React + Vite + Nginx
- **Backend:** Node.js + Express
- **Infra:** Docker Compose
- **IA local:** Ollama (`/api/chat`)
- **Integración visible:** estado de OpenClaw dashboard

## Qué hace

- 🤖 **Multi-Model Selector** - Cambiar entre modelos Ollama sin reiniciar
- 📊 Dashboard con estado en tiempo real de Ollama/OpenClaw
- 🎯 Generador de estrategia de negocio con IA local
- 📈 Historial persistente y estadísticas
- 🎨 6 temas personalizables (Dark, Light, Ocean, Forest, Sunset, Neon)
- 📄 Exportar estrategias a PDF/JSON
- 🔄 WebSocket para actualizaciones en tiempo real
- 🏗️ Arquitectura lista para automatizaciones avanzadas

## Requisitos

- Docker Desktop
- Ollama corriendo localmente con modelos instalados:
  - `qwen2.5:0.5b` (370 MB - rápido, ligero, predeterminado)
  - `llama3.2:latest` (1.88 GB - balance)
  - `dolphin-mixtral:latest` (26 GB - poderoso, opcional)
- OpenClaw opcional para mostrar estado (`http://127.0.0.1:18789`)

## Ejecutar

```powershell
cd C:\Users\luis1\openclaw-ollama-studio
Copy-Item .env.example .env
docker compose up --build -d
```

Abre:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080/api/health

## API principal

### `GET /api/models` - Listar Modelos

```bash
curl http://localhost:8080/api/models
```

Response:
```json
{
  "ok": true,
  "data": {
    "current": "qwen2.5:0.5b",
    "available": [
      { "name": "qwen2.5:0.5b", "size": 0.37 },
      { "name": "llama3.2:latest", "size": 1.88 }
    ]
  }
}
```

### `POST /api/config/model` - Cambiar Modelo

```bash
# Cambiar a Llama 3.2
curl -X POST http://localhost:8080/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2:latest"}'

# Cambiar a Dolphin Mixtral (cuando esté listo)
curl -X POST http://localhost:8080/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"model":"dolphin-mixtral:latest"}'
```

### `POST /api/ai/strategy` - Generar Estrategia

Body (con selector de modelo):

```json
{
  "challenge": "Quiero crecer mi negocio digital",
  "audience": "fundadores y growth",
  "tone": "ejecutivo",
  "model": "llama3.2:latest"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "id": "strat_1778132097696_t7w831f",
    "challenge": "...",
    "model": "llama3.2:latest",
    "content": "**Propuesta...**",
    "timestamp": "2026-05-07T05:32:12.506Z"
  }
}
```

### `GET /api/integrations/status`

Devuelve estado de Ollama y OpenClaw.

## Features Avanzados (v2.5)

- ✅ **Model Selector** - Cambiar modelos desde Settings
- ✅ **Model-aware Generation** - Generar con modelo específico
- ✅ **WebSocket Notifications** - Real-time model change updates
- ✅ **Persistent History** - SQLite para estrategias
- ✅ **Export** - PDF y JSON
- ✅ **Dark Mode** - 6 temas personalizables
- ✅ **Analytics** - Gráficos y estadísticas

📖 **Documentación detallada:** 
- [MODELS.md](./MODELS.md) - Comparación y uso de modelos disponibles
- [MODEL-SELECTOR-GUIDE.md](./MODEL-SELECTOR-GUIDE.md) - Guía del selector de modelos

## Detener

```powershell
docker compose down
```
