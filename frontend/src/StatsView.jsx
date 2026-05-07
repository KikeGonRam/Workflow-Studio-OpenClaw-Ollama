import { useEffect, useState } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export function StatsView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        if (data.ok) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Cargando estadísticas...</p>;
  }

  if (!stats) {
    return <p style={{ textAlign: "center", color: "var(--error)" }}>Error cargando stats</p>;
  }

  // Trend data (últimos 30 días)
  const trendData = {
    labels: stats.trend_30days.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
    }),
    datasets: [
      {
        label: "Estrategias generadas",
        data: stats.trend_30days.map((d) => d.count),
        borderColor: "var(--accent)",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Audience distribution
  const audienceData = {
    labels: stats.by_audience.map((a) => a.audience),
    datasets: [
      {
        label: "Por audiencia",
        data: stats.by_audience.map((a) => a.count),
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
      },
    ],
  };

  // Tone distribution
  const toneData = {
    labels: stats.by_tone.map((t) => t.tone),
    datasets: [
      {
        label: "Por tono",
        data: stats.by_tone.map((t) => t.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(244, 63, 94, 0.8)",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: "var(--text-primary)",
        },
      },
    },
    scales: {
      y: {
        ticks: { color: "var(--text-secondary)" },
        grid: { color: "var(--border-light)" },
      },
      x: {
        ticks: { color: "var(--text-secondary)" },
        grid: { color: "var(--border-light)" },
      },
    },
  };

  return (
    <div className="stats-view">
      <h2>📊 Estadísticas</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Estrategias generadas</p>
        </div>
        <div className="stat-card">
          <h3>{stats.by_audience.length}</h3>
          <p>Audiencias únicas</p>
        </div>
        <div className="stat-card">
          <h3>{stats.by_tone.length}</h3>
          <p>Tonos utilizados</p>
        </div>
        <div className="stat-card">
          <h3>{stats.trend_30days.length}</h3>
          <p>Días con actividad (30d)</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h4>Tendencia últimos 30 días</h4>
          <Line data={trendData} options={chartOptions} />
        </div>

        <div className="chart-container">
          <h4>Distribución por audiencia</h4>
          <Doughnut
            data={audienceData}
            options={{
              ...chartOptions,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>

        <div className="chart-container">
          <h4>Distribución por tono</h4>
          <Bar data={toneData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
