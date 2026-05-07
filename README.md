# OpenClaw Ollama Studio

Sitio web profesional fullstack dockerizado para demostrar lo que puedes construir con **Ollama + OpenClaw + IA aplicada**.

## Stack

- **Frontend:** React + Vite + Nginx
- **Backend:** Node.js + Express
- **Infra:** Docker Compose
- **IA local:** Ollama (`/api/chat`)
- **Integración visible:** estado de OpenClaw dashboard

## Qué hace

- Dashboard con estado en tiempo real de Ollama/OpenClaw
- Generador de estrategia de negocio con IA local
- Arquitectura lista para automatizaciones avanzadas

## Requisitos

- Docker Desktop
- Ollama corriendo localmente (ejemplo: `qwen2.5:0.5b`)
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

### `POST /api/ai/strategy`

Body:

```json
{
  "challenge": "Quiero crecer mi negocio digital con automatizaciones",
  "audience": "fundadores y growth",
  "tone": "ejecutivo"
}
```

### `GET /api/integrations/status`

Devuelve estado de Ollama y OpenClaw.

## Detener

```powershell
docker compose down
```
