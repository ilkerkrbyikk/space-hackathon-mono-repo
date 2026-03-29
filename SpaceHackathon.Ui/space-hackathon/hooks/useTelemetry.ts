"use client";
import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export type TelemetryPacket = {
  timestamp: number;
  value: number;
  rawValue: number;
  is_anomaly: boolean;
  confidence: number;
  satelliteId: string;
  sensorType: string;
  anomalyType: AnomalyType;
};
export type AnomalyType = "NONE" | "SPIKE" | "DROP" | "DRIFT";

export const useTelemetry = () => {
  const [latest, setLatest] = useState<TelemetryPacket | null>(null);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:44353/telemetryHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on("ReceiveTelemetry", (packet) => {
      // Backend camelCase → frontend snake_case normalize
      const p: TelemetryPacket = {
        timestamp: packet.timestamp,
        value: packet.value,
        rawValue: packet.rawValue ?? packet.value,
        is_anomaly: packet.isAnomaly,
        confidence: packet.confidence,
        satelliteId: packet.satelliteId ?? "UNKNOWN",
        sensorType: packet.sensorType ?? "UNKNOWN",
        anomalyType: packet.anomalyType ?? "NONE",
      };

      setLatest(p);
      setHistory((prev) => [...prev.slice(-39), p]);
      if (p.is_anomaly) setAnomalyCount((c) => c + 1);
    });

    connection
      .start()
      .then(() => console.log("Kontrol merkezi telsiz hattı bağlandı!"))
      .catch((err) =>
        console.error("Bağlantı hatası (Backend açık mı?):", err),
      );

    connectionRef.current = connection;

    return () => {
      connectionRef.current?.stop().then(() => {
        connectionRef.current = null;
      });
    };
  }, []);

  return { latest, history, anomalyCount };
};
