"use client";
import { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import dynamic from "next/dynamic";

const CosmicView = dynamic(() => import("@/components/CosmicView"), {
  ssr: false,
});

const SATELLITES = ["ALL", "SAT-TUA-01", "SAT-TUA-02", "SAT-TUA-03"];
const SENSORS = ["Temperature", "Voltage", "Radiation"];

export default function MissionControl() {
  const { latest, history, anomalyCount } = useTelemetry();
  const [selectedSat, setSelectedSat] = useState("ALL");
  const [selectedSensor, setSelectedSensor] = useState("Temperature");

  const filteredHistory = history.filter(
    (h) =>
      (selectedSat === "ALL" || h.satelliteId === selectedSat) &&
      h.sensorType === selectedSensor,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-emerald-500 tracking-tighter">
            TUA // COSMIC_PIPELINE_V1
          </h1>
          <p className="text-[10px] text-slate-500">
            ANKARA_GROUND_STATION — 3 SATELLITES ACTIVE
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs animate-pulse text-emerald-400">
            ● SIGNAL_ESTABLISHED
          </div>
          <div className="text-[10px] text-slate-600">
            PACKETS: {history.length} | ANOMALIES: {anomalyCount}
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex gap-6 mb-4">
        <div className="flex gap-1 items-center">
          <span className="text-[9px] text-slate-600 mr-2">SATELLITE:</span>
          {SATELLITES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSat(s)}
              className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                selectedSat === s
                  ? "border-emerald-600 text-emerald-400 bg-emerald-950/30"
                  : "border-slate-800 text-slate-600 hover:border-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[9px] text-slate-600 mr-2">SENSOR:</span>
          {SENSORS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSensor(s)}
              className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                selectedSensor === s
                  ? "border-emerald-600 text-emerald-400 bg-emerald-950/30"
                  : "border-slate-800 text-slate-600 hover:border-slate-600"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[500px]">
        {/* Sol: Metrikler */}
        <div className="col-span-3 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded shadow-2xl">
            <div className="text-[9px] text-slate-500 mb-1">ACTIVE_SOURCE</div>
            <div className="text-emerald-400 text-xs font-bold">
              {latest?.satelliteId ?? "---"}
            </div>
            <div className="text-slate-400 text-[10px]">
              {latest?.sensorType ?? "---"}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded shadow-2xl">
            <h3 className="text-[10px] text-slate-500 mb-1">RAW_VALUE</h3>
            <p className="text-2xl font-bold tracking-tight text-red-400">
              {latest?.rawValue !== undefined
                ? latest.rawValue.toFixed(4)
                : "---.----"}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded shadow-2xl">
            <h3 className="text-[10px] text-slate-500 mb-1">CLEANED_VALUE</h3>
            <p className="text-2xl font-bold tracking-tight text-emerald-400">
              {latest?.value !== undefined
                ? latest.value.toFixed(4)
                : "---.----"}
            </p>
          </div>

          <div
            className={`p-3 border rounded transition-colors duration-500 ${
              latest?.is_anomaly
                ? "bg-red-950/20 border-red-800"
                : "bg-emerald-950/20 border-emerald-800"
            }`}
          >
            <h3 className="text-[10px] mb-1">HEALTH_STATUS</h3>
            <p className="font-bold text-xs tracking-widest">
              {latest?.is_anomaly ? "⚠️ ANOMALY_DETECTED" : "✓ SYSTEM_NOMINAL"}
            </p>
            {latest?.is_anomaly && latest.anomalyType !== "NONE" && (
              <span
                className={`mt-1 inline-block text-[9px] px-2 py-0.5 rounded font-bold tracking-widest ${
                  latest.anomalyType === "SPIKE"
                    ? "bg-red-900/40 text-red-300"
                    : latest.anomalyType === "DROP"
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-yellow-900/40 text-yellow-300"
                }`}
              >
                {latest.anomalyType}
              </span>
            )}
            <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(latest?.confidence ?? 0) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-600 mt-1">
              CONFIDENCE: {((latest?.confidence ?? 0) * 100).toFixed(0)}%
            </p>
          </div>

          <div className="bg-slate-900 border border-red-900/40 p-3 rounded shadow-2xl">
            <h3 className="text-[10px] text-slate-500 mb-1">ANOMALY_COUNT</h3>
            <p className="text-3xl font-bold text-red-400">{anomalyCount}</p>
            <p className="text-[9px] text-slate-600">TOTAL / SESSION</p>
          </div>
        </div>

        {/* Sağ: Grafik */}
        <div className="col-span-9 bg-slate-900 border border-slate-800 rounded relative shadow-inner">
          <div className="absolute top-2 right-2 z-10 text-[9px] text-slate-600 font-mono">
            {selectedSat} / {selectedSensor.toUpperCase()} /{" "}
            {filteredHistory.length}_PTS
          </div>
          <CosmicView history={filteredHistory} />
        </div>
      </div>

      {/* Terminal Log */}
      <div className="mt-6 bg-black border border-slate-800 p-3 h-32 overflow-y-auto rounded shadow-2xl">
        <div className="text-[9px] text-slate-500 mb-2 border-b border-slate-800 pb-1">
          INCOMING_TELEMETRY_LOGS_ (ALL SATELLITES)
        </div>
        {history
          .slice()
          .reverse()
          .map((h, i) => (
            <div
              key={i}
              className="text-[9px] flex gap-4 hover:bg-slate-900 transition-colors"
            >
              <span className="text-slate-700">[{h.timestamp}]</span>
              <span className="text-slate-500">{h.satelliteId}</span>
              <span className="text-slate-600">{h.sensorType}</span>
              <span className="text-red-700">
                R:{h.rawValue?.toFixed(4) ?? "---"}
              </span>
              <span className="text-emerald-700">
                C:{h.value?.toFixed(4) ?? "---"}
              </span>
              <span
                className={
                  h.is_anomaly
                    ? h.anomalyType === "SPIKE"
                      ? "text-red-400 font-bold"
                      : h.anomalyType === "DROP"
                        ? "text-blue-400 font-bold"
                        : h.anomalyType === "DRIFT"
                          ? "text-yellow-400 font-bold"
                          : "text-red-500 font-bold"
                    : "text-slate-700"
                }
              >
                {h.is_anomaly ? `!${h.anomalyType}!` : "OK"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
