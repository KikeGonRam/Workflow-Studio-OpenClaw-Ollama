# 🤖 Model Selector Guide - OpenClaw + Ollama Studio

## Overview
El modelo selector permite cambiar dinámicamente entre modelos de Ollama disponibles sin reiniciar la aplicación. La selección actual se mantiene en memoria y se utiliza para todas las generaciones de estrategias.

## Features Implementados ✅

### 1. **GET /api/models** - List Available Models
Obtiene la lista de modelos disponibles en Ollama con información adicional.

**Endpoint:**
```
GET http://localhost:8080/api/models
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "current": "qwen2.5:0.5b",
    "available": [
      {
        "name": "qwen2.5:0.5b",
        "size": 0.37,
        "digest": "abc123..."
      },
      {
        "name": "llama3.2:latest",
        "size": 1.88,
        "digest": "def456..."
      }
    ]
  }
}
```

### 2. **POST /api/config/model** - Switch Model
Cambia el modelo actual validando que exista en Ollama.

**Endpoint:**
```
POST http://localhost:8080/api/config/model
Content-Type: application/json

{
  "model": "llama3.2:latest"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Model changed",
  "current": "llama3.2:latest"
}
```

**Error (404):**
```json
{
  "ok": false,
  "error": "Model not found in Ollama"
}
```

### 3. **POST /api/ai/strategy** - Generate with Specific Model
Genera una estrategia usando un modelo específico (o el actual si no se especifica).

**Endpoint:**
```
POST http://localhost:8080/api/ai/strategy
Content-Type: application/json

{
  "challenge": "How can I improve team productivity?",
  "audience": "tech teams",
  "tone": "profesional",
  "model": "llama3.2:latest"  // OPCIONAL - usa CURRENT_MODEL si no se especifica
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "strat_1778132097696_t7w831f",
    "challenge": "How can I improve team productivity?",
    "audience": "tech teams",
    "tone": "profesional",
    "model": "llama3.2:latest",
    "content": "**Improvement de Productividad...**",
    "timestamp": "2026-05-07T05:32:12.506Z"
  }
}
```

## UI Integration

### Settings View - Model Selector
**Location:** `Settings` tab → "Modelos IA" section

**Features:**
- 📋 Lista de todos los modelos disponibles
- 📊 Muestra tamaño en GB
- ⭐ Indicador visual del modelo actual
- ⚙️ Botón para cambiar modelo
- 🔄 Auto-refresh de disponibilidad

**Component:** `frontend/src/SettingsView.jsx` (lines ~175-220)

```jsx
const handleModelChange = async (modelName) => {
  setLoadingModels(true);
  try {
    const res = await fetch("/api/config/model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelName }),
    });
    const data = await res.json();
    if (data.ok) {
      setCurrentModel(modelName);
    }
  } catch (err) {
    console.error("Error changing model:", err);
  } finally {
    setLoadingModels(false);
  }
};
```

## Backend Architecture

### Key Changes (v2.5)

**1. Model State Management**
- Changed from `const MODEL` to `let CURRENT_MODEL` for dynamic switching
- Located in `backend/src/index.js` line 29
- Persisted in memory (no restart needed)

**2. Database Helper Functions** (`backend/src/database.js`)
- All database operations now use `async/await`
- Fixed async bugs that caused `TypeError: e.data.filter is not a function`

**3. New Endpoints**

```javascript
// List available models
app.get("/api/models", async (req, res) => {
  // Fetches from Ollama /api/tags
  // Transforms size to GB
  // Returns current model info
});

// Switch model with validation
app.post("/api/config/model", async (req, res) => {
  // Validates model exists
  // Tests with Ollama API
  // Emits WebSocket event
  // Updates CURRENT_MODEL
});
```

**4. Strategy Generation with Model Parameter**

```javascript
app.post("/api/ai/strategy", async (req, res) => {
  const { challenge, audience, tone, model } = req.body;
  const selectedModel = model || CURRENT_MODEL;  // Model selector support
  
  // Generate with selected model
  const content = await generateStrategy(
    challenge, 
    audience, 
    tone, 
    selectedModel  // Pass model param
  );
  
  // Return with model info
  res.json({
    ok: true,
    data: {
      id, challenge, audience, tone,
      model: selectedModel,  // Include model in response
      content,
      timestamp
    }
  });
});
```

## WebSocket Events

### Model Change Notifications
When a model is switched, all connected clients receive:

```javascript
io.emit("model:changed", { 
  model: CURRENT_MODEL 
});
```

**Listen in Frontend:**
```javascript
socket.on("model:changed", (data) => {
  console.log("Model changed to:", data.model);
  // Update UI or reload models list
});
```

## Testing

### Test 1: List Models
```bash
curl http://localhost:8080/api/models
```

### Test 2: Change Model
```bash
curl -X POST http://localhost:8080/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2:latest"}'
```

### Test 3: Generate with Specific Model
```bash
curl -X POST http://localhost:8080/api/ai/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "challenge": "How can I improve productivity?",
    "audience": "tech teams",
    "tone": "profesional",
    "model": "llama3.2:latest"
  }'
```

## Performance Considerations

⚠️ **Model Loading Times:**
- Small models (qwen2.5:0.5b): ~2-5 seconds to load
- Medium models (llama3.2): ~10-15 seconds
- Generation time depends on model complexity and prompt length

💡 **Optimization Tips:**
- Pre-load models in Ollama before switching
- Implement loading indicators for long operations
- Consider caching strategy outputs for same inputs

## Future Enhancements

### Phase 3 Features (Roadmap)
- [ ] Model usage statistics/metrics
- [ ] Side-by-side comparison (generate same strategy with 2+ models)
- [ ] Model performance benchmarks
- [ ] Downloaded model management UI
- [ ] Custom model installation from Ollama Hub
- [ ] Model-specific prompt templates

### Phase 4 Integration
- [ ] VSCode extension with model selector
- [ ] Spotify API with dynamic model selection per mood
- [ ] Smart model selection based on task complexity

## Troubleshooting

### Model Not Found Error
**Error:** `"Model not found in Ollama"`
**Solution:** 
1. Run `ollama list` to see available models
2. If model is missing, install with: `ollama pull model-name`
3. Restart backend or wait for model to download

### Slow Generation
**Cause:** Model too large for system resources
**Solution:**
- Use smaller model (qwen2.5:0.5b = 370MB)
- Close other applications
- Increase system RAM

### WebSocket Connection Issues
**Cause:** Port 8080 in use or firewall blocking
**Solution:**
- Check: `netstat -ano | findstr :8080`
- Kill conflicting process or change PORT in `.env`

## Files Modified

```
backend/src/index.js
  ✓ Changed MODEL to CURRENT_MODEL
  ✓ Added GET /api/models endpoint
  ✓ Added POST /api/config/model endpoint
  ✓ Updated generateStrategy() signature
  ✓ Updated /api/ai/strategy response structure
  ✓ Fixed async/await in all endpoints

frontend/src/SettingsView.jsx
  ✓ Added models state (useState)
  ✓ Added currentModel state
  ✓ Added useEffect to load models on mount
  ✓ Added handleModelChange() function
  ✓ Added model selector UI section
```

## Version Info
- **Release:** v2.5.0 - Multi-Model Support
- **Date:** 2026-05-07
- **Commit:** 7abdc57 (GitHub)
- **Status:** ✅ Production Ready

---

**Next Steps:**
1. Open http://localhost:3000 in browser
2. Go to Settings tab
3. Select a model and generate strategies
4. Monitor model performance and adjust selection as needed
