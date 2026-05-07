import { useEffect, useState } from "react";

const THEMES = {
  dark: {
    name: "Oscuro",
    colors: {
      "--bg-primary": "#030712",
      "--bg-secondary": "#111827",
      "--bg-tertiary": "#0b1220",
      "--text-primary": "#e5e7eb",
      "--text-secondary": "#cbd5e1",
      "--text-muted": "#9ca3af",
      "--accent": "#2563eb",
      "--accent-light": "#89a5ff",
    },
  },
  light: {
    name: "Claro",
    colors: {
      "--bg-primary": "#f8fafc",
      "--bg-secondary": "#f1f5f9",
      "--bg-tertiary": "#ffffff",
      "--text-primary": "#1e293b",
      "--text-secondary": "#475569",
      "--text-muted": "#64748b",
      "--accent": "#2563eb",
      "--accent-light": "#3b82f6",
    },
  },
  ocean: {
    name: "Océano",
    colors: {
      "--bg-primary": "#0f172a",
      "--bg-secondary": "#1e293b",
      "--bg-tertiary": "#334155",
      "--text-primary": "#e0f2fe",
      "--text-secondary": "#bae6fd",
      "--text-muted": "#7dd3fc",
      "--accent": "#0284c7",
      "--accent-light": "#06b6d4",
    },
  },
  forest: {
    name: "Bosque",
    colors: {
      "--bg-primary": "#0d2818",
      "--bg-secondary": "#16a34a",
      "--bg-tertiary": "#22c55e",
      "--text-primary": "#dcfce7",
      "--text-secondary": "#b7e4c7",
      "--text-muted": "#86efac",
      "--accent": "#15803d",
      "--accent-light": "#22c55e",
    },
  },
  sunset: {
    name: "Atardecer",
    colors: {
      "--bg-primary": "#3d1a1a",
      "--bg-secondary": "#7c2d12",
      "--bg-tertiary": "#b45309",
      "--text-primary": "#fed7aa",
      "--text-secondary": "#fdba74",
      "--text-muted": "#fca5a5",
      "--accent": "#ea580c",
      "--accent-light": "#fb923c",
    },
  },
  neon: {
    name: "Neón",
    colors: {
      "--bg-primary": "#0a0e27",
      "--bg-secondary": "#1d1b4b",
      "--bg-tertiary": "#312e81",
      "--text-primary": "#e0e7ff",
      "--text-secondary": "#c7d2fe",
      "--text-muted": "#a5b4fc",
      "--accent": "#8b5cf6",
      "--accent-light": "#c084fc",
    },
  },
};

export function SettingsView() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("custom-theme") || "dark";
  });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("app-preferences");
    return saved
      ? JSON.parse(saved)
      : {
          autoSave: true,
          enableNotifications: true,
          itemsPerPage: 10,
        };
  });

  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(true);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.ok) {
          setModels(data.data.available || []);
          setCurrentModel(data.data.current || "");
        }
      } catch (err) {
        console.error("Error loading models:", err);
      } finally {
        setLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  // Apply theme
  useEffect(() => {
    const theme = THEMES[currentTheme];
    if (theme) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      localStorage.setItem("custom-theme", currentTheme);
    }
  }, [currentTheme]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("app-preferences", JSON.stringify(preferences));
  }, [preferences]);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

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

  return (
    <div className="settings-view">
      <h2>⚙️ Configuración</h2>

      <section className="settings-section">
        <h3>Temas</h3>
        <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
          Elige tu esquema de colores preferido
        </p>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button
              key={key}
              className={`theme-option ${currentTheme === key ? "active" : ""}`}
              onClick={() => handleThemeChange(key)}
              style={{
                backgroundColor: theme.colors["--bg-secondary"],
                border:
                  currentTheme === key
                    ? `2px solid ${theme.colors["--accent"]}`
                    : "2px solid transparent",
              }}
            >
              <span className="theme-name">{theme.name}</span>
              <div className="theme-preview">
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: theme.colors["--accent"],
                    borderRadius: "50%",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>🤖 Modelos de IA</h3>
        <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
          Selecciona el modelo Ollama para generar estrategias
        </p>
        {loadingModels ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando modelos...</p>
        ) : models.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No hay modelos disponibles</p>
        ) : (
          <div className="models-list">
            {models.map((model) => (
              <button
                key={model.name}
                className={`model-option ${currentModel === model.name ? "active" : ""}`}
                onClick={() => handleModelChange(model.name)}
                disabled={loadingModels}
                style={{
                  padding: "0.75rem 1rem",
                  marginBottom: "0.5rem",
                  border:
                    currentModel === model.name
                      ? "2px solid var(--accent)"
                      : "2px solid var(--bg-secondary)",
                  backgroundColor: currentModel === model.name ? "var(--accent)" : "transparent",
                  color:
                    currentModel === model.name
                      ? "var(--bg-primary)"
                      : "var(--text-primary)",
                  borderRadius: "8px",
                  cursor: loadingModels ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <strong>{model.name}</strong>
                <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>
                  ({model.size.toFixed(2)} GB)
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Preferencias</h3>


        <label className="setting-option">
          <input
            type="checkbox"
            checked={preferences.autoSave}
            onChange={(e) =>
              handlePreferenceChange("autoSave", e.target.checked)
            }
          />
          <span>Guardar estrategias automáticamente</span>
        </label>

        <label className="setting-option">
          <input
            type="checkbox"
            checked={preferences.enableNotifications}
            onChange={(e) =>
              handlePreferenceChange("enableNotifications", e.target.checked)
            }
          />
          <span>Habilitar notificaciones</span>
        </label>

        <label className="setting-option">
          <span>Items por página en historial</span>
          <select
            value={preferences.itemsPerPage}
            onChange={(e) =>
              handlePreferenceChange("itemsPerPage", parseInt(e.target.value))
            }
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h3>Acerca de</h3>
        <p>
          <strong>OpenClaw + Ollama Studio</strong>
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Versión 2.0 • Fullstack con histórico, gráficos y exportación
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Desarrollado con React, Express, WebSocket y SQLite
        </p>
      </section>
    </div>
  );
}
