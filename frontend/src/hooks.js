import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import jsPDF from "jspdf";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const WS_URL = typeof window !== "undefined" ? window.location.origin : "";

export function useWebSocket() {
  const [status, setStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[WS] Connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[WS] Disconnected");
    });

    socket.on("status:update", (data) => {
      setStatus(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return { status, isConnected, socket: socketRef.current, emit };
}

// Export strategy to PDF
export function exportPDF(strategy) {
  const doc = new jsPDF();

  const title = `Estrategia: ${strategy.audience}`;
  const lines = [
    `Reto: ${strategy.challenge}`,
    `Audiencia: ${strategy.audience}`,
    `Tono: ${strategy.tone}`,
    `Fecha: ${new Date(strategy.created_at).toLocaleDateString("es-ES")}`,
    "",
    "PROPUESTA:",
    ...strategy.response.split("\n"),
  ];

  let y = 20;
  doc.setFontSize(16);
  doc.text(title, 20, y);
  y += 15;

  doc.setFontSize(11);
  lines.forEach((line) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 6;
  });

  const filename = `estrategia_${strategy.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}

// Export strategy to JSON
export function exportJSON(strategy) {
  const data = JSON.stringify(strategy, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estrategia_${strategy.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Copy to clipboard
export function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}
