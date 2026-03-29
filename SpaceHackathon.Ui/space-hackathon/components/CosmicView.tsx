"use client";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { TelemetryPacket } from "@/hooks/useTelemetry";

const SENSOR_PROFILES: Record<
  string,
  { min: number; max: number; unit: string }
> = {
  Temperature: { min: 20, max: 30, unit: "°C" },
  Voltage: { min: 12.0, max: 12.5, unit: "V" },
  Radiation: { min: 0, max: 2, unit: "mSv" },
};

const X_MIN = -8;
const X_MAX = 8;
const Y_SCALE = 3; // normal range → ±3 birim
const Y_CLAMP = 5; // anomali ne kadar yükselirse yükselsin, ±5'te kes

function normalize(value: number, sensorType: string): number {
  const p = SENSOR_PROFILES[sensorType] ?? { min: 0, max: 100, unit: "" };
  const center = (p.min + p.max) / 2;
  const half = (p.max - p.min) / 2;
  const raw = ((value - center) / half) * Y_SCALE;
  return Math.max(-Y_CLAMP, Math.min(Y_CLAMP, raw)); // clamp
}

function toX(i: number, total: number): number {
  return X_MIN + (i / Math.max(total - 1, 1)) * (X_MAX - X_MIN);
}

// 3D koordinata HTML etiket yapıştır
function YLabel({ y, label }: { y: number; label: string }) {
  return (
    <Html
      position={[X_MIN - 0.5, y, 0]}
      center
      style={{ pointerEvents: "none" }}
    >
      <span
        style={{
          fontSize: "8px",
          fontFamily: "monospace",
          color: "#475569",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </Html>
  );
}

function TelemetryLines({
  history,
  sensorType,
}: {
  history: TelemetryPacket[];
  sensorType: string;
}) {
  const profile = SENSOR_PROFILES[sensorType] ?? { min: 0, max: 100, unit: "" };
  const center = (profile.min + profile.max) / 2;
  const quarter = (profile.max - profile.min) / 4;
  const u = profile.unit;

  const yTicks: { y: number; label: string }[] = [
    { y: Y_SCALE, label: `${profile.max}${u}` },
    { y: Y_SCALE / 2, label: `${(center + quarter).toFixed(2)}${u}` },
    { y: 0, label: `${center.toFixed(2)}${u}` },
    { y: -Y_SCALE / 2, label: `${(center - quarter).toFixed(2)}${u}` },
    { y: -Y_SCALE, label: `${profile.min}${u}` },
  ];

  const { rawPts, cleanPts, anomalies } = useMemo(() => {
    const count = history.length;
    const rawPts = history.map(
      (d, i) =>
        new THREE.Vector3(
          toX(i, count),
          normalize(d.rawValue, d.sensorType),
          0,
        ),
    );
    const cleanPts = history.map(
      (d, i) =>
        new THREE.Vector3(toX(i, count), normalize(d.value, d.sensorType), 0),
    );
    const anomalies = history
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d.is_anomaly);

    return { rawPts, cleanPts, anomalies };
  }, [history]);

  if (history.length < 2) return null;

  return (
    <>
      {/* Y eksen tick çizgileri + etiketler */}
      {yTicks.map(({ y, label }) => (
        <group key={y}>
          <Line
            points={[
              new THREE.Vector3(X_MIN, y, 0),
              new THREE.Vector3(X_MAX, y, 0),
            ]}
            color={
              y === 0
                ? "#1e293b"
                : y === Y_SCALE || y === -Y_SCALE
                  ? "#1e3a2f"
                  : "#0f172a"
            }
            lineWidth={1}
          />
          <YLabel y={y} label={label} />
        </group>
      ))}

      {/* Raw signal */}
      <Line points={rawPts} color="#ef4444" lineWidth={2} />

      {/* Cleaned signal */}
      <Line points={cleanPts} color="#10b981" lineWidth={2} />

      {/* Anomali markerlar */}
      {anomalies.map(({ d, i }) => (
        <mesh
          key={i}
          position={[
            toX(i, history.length),
            normalize(d.rawValue, d.sensorType),
            0,
          ]}
        >
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}
    </>
  );
}

export default function CosmicView({
  history,
}: {
  history: TelemetryPacket[];
}) {
  const sensorType =
    history.length > 0 ? history[history.length - 1].sensorType : "Temperature";

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 left-12 z-10 flex gap-4 text-[9px] font-mono">
        <span className="text-red-400">▬ RAW</span>
        <span className="text-emerald-400">▬ CLEANED</span>
        <span className="text-yellow-400">● ANOMALY</span>
      </div>
      <Canvas camera={{ position: [0, 0, 14], fov: 50 }}>
        <TelemetryLines history={history} sensorType={sensorType} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}
