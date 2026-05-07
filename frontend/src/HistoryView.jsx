import { useEffect, useState } from "react";
import { exportPDF, exportJSON, copyToClipboard } from "./hooks.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export function HistoryView() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const limit = 10;
  const offset = (page - 1) * limit;

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/strategies?limit=${limit}&offset=${offset}`
      );
      const data = await res.json();
      if (data.ok) {
        const filtered = data.data.filter(
          (s) =>
            s.challenge.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.audience.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setStrategies(filtered);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Error loading strategies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, [page, searchTerm]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta estrategia?")) return;
    try {
      const res = await fetch(`${API_BASE}/strategies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadStrategies();
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  return (
    <div className="history-view">
      <h2>📚 Historial de estrategias</h2>
      <input
        type="text"
        placeholder="Buscar por reto o audiencia..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
        className="search-input"
      />

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Cargando...
        </p>
      ) : strategies.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          No hay estrategias guardadas
        </p>
      ) : (
        <>
          <div className="history-table">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="history-item">
                <div className="history-header">
                  <div>
                    <h4>{strategy.audience}</h4>
                    <p className="history-meta">
                      {strategy.tone} •{" "}
                      {new Date(strategy.created_at).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                  <div className="history-actions">
                    <button
                      onClick={() => exportJSON(strategy)}
                      title="Exportar JSON"
                      className="btn-small"
                    >
                      📥 JSON
                    </button>
                    <button
                      onClick={() => exportPDF(strategy)}
                      title="Exportar PDF"
                      className="btn-small"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => copyToClipboard(strategy.response)}
                      title="Copiar"
                      className="btn-small"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleDelete(strategy.id)}
                      title="Eliminar"
                      className="btn-small btn-danger"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="history-challenge">{strategy.challenge}</p>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              ← Anterior
            </button>
            <span>
              Página {page} de {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={offset + limit >= total}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
