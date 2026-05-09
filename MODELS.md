# 🤖 Modelos Disponibles - OpenClaw Ollama Studio

## Modelos Instalados

### 1. **Qwen 2.5 (0.5B)** - ⚡ RÁPIDO y LIGERO
- **Tamaño**: 370 MB
- **Velocidad**: Muy rápida (< 2s respuesta)
- **Memoria**: Bajo consumo
- **Ideal para**: Pruebas rápidas, prototipado, desarrollo
- **Configuración**: `OLLAMA_MODEL=qwen2.5:0.5b` (PREDETERMINADO)

### 2. **Llama 3.2** - ⚖️ BALANCE
- **Tamaño**: 1.88 GB
- **Velocidad**: Rápida (2-5s respuesta)
- **Memoria**: Consumo moderado
- **Ideal para**: Producción, respuestas más coherentes
- **Configuración**: `OLLAMA_MODEL=llama3.2:latest`

### 3. **Dolphin Mixtral** - 🚀 PODEROSO y FLEXIBLE
- **Tamaño**: ~26 GB (descargándose...)
- **Velocidad**: Media (5-15s respuesta)
- **Memoria**: Alto consumo
- **Ideal para**: Tareas complejas, análisis profundo, estrategias detalladas
- **Configuración**: `OLLAMA_MODEL=dolphin-mixtral:latest`
- **Status**: En descarga (se completará en background)

---

## 🎯 Recomendaciones de Uso

| Caso de Uso | Modelo Recomendado | Razón |
|---|---|---|
| Desarrollo/Testing | Qwen 2.5 | Rápido, bajo consumo |
| Producción | Llama 3.2 | Buen balance velocidad/calidad |
| Estrategias Complejas | Dolphin Mixtral | Mejor comprensión y análisis |
| Bajo Consumo de RAM | Qwen 2.5 | Solo 370 MB |
| Máxima Calidad | Dolphin Mixtral | Modelo más avanzado |

---

## 📝 Cómo Cambiar de Modelo

### Opción 1: Desde la UI (Settings)
1. Abre http://localhost:3000
2. Ve a Settings ⚙️
3. Selecciona el modelo en "Model Selection"
4. El modelo se cambiará inmediatamente

### Opción 2: Variable de Entorno
```bash
# Edita .env
OLLAMA_MODEL=dolphin-mixtral:latest

# Reinicia el backend
docker-compose restart oos-backend
```

### Opción 3: API REST
```bash
curl -X POST http://localhost:8080/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"model": "dolphin-mixtral:latest"}'
```

---

## ⚙️ Gestión de Modelos en Ollama

### Ver modelos instalados
```bash
ollama list
```

### Instalar nuevo modelo
```bash
ollama pull <model-name>
# Ejemplos:
ollama pull dolphin-mixtral:latest
ollama pull mistral:latest
ollama pull neural-chat:latest
```

### Eliminar modelo (liberar espacio)
```bash
ollama rm <model-name>
```

---

## 📊 Comparación de Performance

```
Qwen 2.5:
  Estrategia simple: ~1-2 segundos
  
Llama 3.2:
  Estrategia simple: ~3-5 segundos
  
Dolphin Mixtral:
  Estrategia simple: ~5-15 segundos
  Estrategia compleja: ~15-30 segundos
```

---

## 🔄 Status de Descarga

- ✅ **Qwen 2.5 (0.5B)**: Instalado y operativo
- ✅ **Llama 3.2**: Instalado y operativo  
- ⏳ **Dolphin Mixtral**: En descarga (puede tomar 30-60 minutos, depende de velocidad de internet)

Para ver el progreso en tiempo real:
```bash
docker logs ollama
```

---

## 💡 Tips

1. **Dolphin Mixtral tomará mucho espacio**: Asegúrate de tener ~30 GB libres
2. **Primero usa Qwen 2.5**: Para testear el sistema antes de descargar modelos grandes
3. **Cambia modelos dinámicamente**: Sin necesidad de reiniciar el servidor
4. **Combina modelos**: Usa Qwen para testing rápido y Dolphin para análisis profundo

---

## 📚 Recursos Adicionales

- [Ollama Models Library](https://ollama.ai/library)
- [Model Comparison](https://huggingface.co/models?sort=trending)
- [System Requirements](https://ollama.ai/download)

