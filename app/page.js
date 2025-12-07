"use client";

import { useEffect, useMemo, useState } from "react";

const SHADES = "█▓▒░";
const WIDTH = 96;
const HEIGHT = 32;
const Z_OFFSET = 6;
const LIGHT_DIR = normalize([0.3, 0.7, -0.6]);

function normalize(v) {
  const len = Math.hypot(...v) || 1;
  return v.map((n) => n / len);
}

function rotateX([x, y, z], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x, y * c - z * s, y * s + z * c];
}

function rotateY([x, y, z], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotatePoint(p, ax, ay) {
  return rotateY(rotateX(p, ax), ay);
}

function rotateNormal(n, ax, ay) {
  // For pure rotations the same transform applies to normals.
  return rotatePoint(n, ax, ay);
}

function makeTorus(R = 1.5, r = 0.6, stepMajor = 0.09, stepMinor = 0.045) {
  const points = [];
  for (let j = 0; j < Math.PI * 2; j += stepMajor) {
    const cosJ = Math.cos(j);
    const sinJ = Math.sin(j);
    for (let i = 0; i < Math.PI * 2; i += stepMinor) {
      const cosI = Math.cos(i);
      const sinI = Math.sin(i);

      const cx = (R + r * cosI) * cosJ;
      const cy = (R + r * cosI) * sinJ;
      const cz = r * sinI;

      const nx = cosI * cosJ;
      const ny = cosI * sinJ;
      const nz = sinI;

      points.push({ p: [cx, cy, cz], n: normalize([nx, ny, nz]) });
    }
  }
  return points;
}

function makeSphere(radius = 1.6, stepLat = 0.22, stepLon = 0.22) {
  const points = [];
  for (let j = 0; j <= Math.PI; j += stepLat) {
    const sinJ = Math.sin(j);
    const cosJ = Math.cos(j);
    for (let i = 0; i < Math.PI * 2; i += stepLon) {
      const sinI = Math.sin(i);
      const cosI = Math.cos(i);
      const x = radius * sinJ * cosI;
      const y = radius * sinJ * sinI;
      const z = radius * cosJ;
      const n = normalize([sinJ * cosI, sinJ * sinI, cosJ]);
      points.push({ p: [x, y, z], n });
    }
  }
  return points;
}

function makeCube(size = 1.5, step = 0.18) {
  const points = [];
  const half = size;
  const ranges = [];
  for (let t = -half; t <= half; t += step) ranges.push(t);

  const faces = [
    { n: [1, 0, 0], p: (u, v) => [half, u, v] },
    { n: [-1, 0, 0], p: (u, v) => [-half, u, v] },
    { n: [0, 1, 0], p: (u, v) => [u, half, v] },
    { n: [0, -1, 0], p: (u, v) => [u, -half, v] },
    { n: [0, 0, 1], p: (u, v) => [u, v, half] },
    { n: [0, 0, -1], p: (u, v) => [u, v, -half] },
  ];

  for (const { n, p } of faces) {
    for (const u of ranges) {
      for (const v of ranges) {
        points.push({ p: p(u, v), n });
      }
    }
  }

  return points;
}

const MODELS = [
  { key: "torus", label: "Donut", points: makeTorus() },
  { key: "cube", label: "Cube", points: makeCube(1.4) },
  { key: "sphere", label: "Sphere", points: makeSphere() },
];

function renderFrame(model, ax, ay) {
  const buffer = Array(WIDTH * HEIGHT).fill(" ");
  const depth = Array(WIDTH * HEIGHT).fill(0);

  for (const { p, n } of model.points) {
    const rotatedP = rotatePoint(p, ax, ay);
    const rotatedN = rotateNormal(n, ax, ay);

    const z = rotatedP[2] + Z_OFFSET;
    const invZ = 1 / z;

    const xProj = rotatedP[0] * invZ;
    const yProj = rotatedP[1] * invZ;

    const screenX = Math.floor(WIDTH / 2 + xProj * WIDTH * 0.6);
    const screenY = Math.floor(HEIGHT / 2 - yProj * HEIGHT * 0.6);

    if (screenX < 0 || screenX >= WIDTH || screenY < 0 || screenY >= HEIGHT) {
      continue;
    }

    const idx = screenX + WIDTH * screenY;
    if (invZ <= depth[idx]) continue;

    depth[idx] = invZ;

    const brightness = Math.max(0, rotatedN[0] * LIGHT_DIR[0] + rotatedN[1] * LIGHT_DIR[1] + rotatedN[2] * LIGHT_DIR[2]);
    const shadeIndex = Math.floor(brightness * (SHADES.length - 1));
    buffer[idx] = SHADES[shadeIndex];
  }

  let out = "";
  for (let y = 0; y < HEIGHT; y++) {
    out += buffer.slice(y * WIDTH, (y + 1) * WIDTH).join("") + "\n";
  }
  return out;
}

export default function Page() {
  const [modelKey, setModelKey] = useState(MODELS[0].key);
  const model = useMemo(() => MODELS.find((m) => m.key === modelKey) ?? MODELS[0], [modelKey]);
  const [frame, setFrame] = useState(() => renderFrame(model, 0, 0));

  useEffect(() => {
    let raf;
    let ax = 0;
    let ay = 0;
    let prev = performance.now();

    const tick = (now) => {
      const dt = (now - prev) / 1000;
      prev = now;
      ax += dt * 0.8;
      ay += dt * 1.2;
      setFrame(renderFrame(model, ax, ay));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [model]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b111a",
        color: "#e8f7ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
          {MODELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setModelKey(key)}
              style={{
                padding: "0.35rem 0.65rem",
                background: key === modelKey ? "#14324f" : "#0c2338",
                color: "#eaf7ff",
                border: "1px solid #194167",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: key === modelKey ? "0 0 12px rgba(120,200,255,0.6)" : "none",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <pre
          style={{
            fontSize: "10px",
            lineHeight: "10px",
            background: "#050913",
            padding: "1.25rem",
            borderRadius: "12px",
            textShadow: "0 0 8px rgba(120,200,255,0.6)",
            color: "#e8f7ff",
            border: "1px solid #0f1c2c",
            boxShadow: "0 0 30px rgba(20,30,50,0.55) inset, 0 0 12px rgba(120,200,255,0.35)",
            whiteSpace: "pre",
          }}
        >
          {frame}
        </pre>
      </div>
    </div>
  );
}
