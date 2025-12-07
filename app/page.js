"use client";

import { useEffect, useMemo, useState } from "react";

const SHADES = " ░▒▓█";
const WIDTH = 96;
const HEIGHT = 32;
const Z_OFFSET = 6;
const LIGHT_DIR = normalize([0.3, 0.7, -0.6]);

function normalize(v) {
  const len = Math.hypot(...v) || 1;
  return v.map((n) => n / len);
}

const MODELS = [
  {
    key: "cube",
    label: "Cube",
    points: makeCube(),
  },
  {
    key: "wideCube",
    label: "Wide Cube",
    points: makeCube(1.5, 0.18, [1.5, 1.0, 1.5]),
  },
  {
    key: "sphere",
    label: "Sphere",
    points: makeSphere(),
  },
  {
    key: "torus",
    label: "Torus",
    points: makeTorus(),
  },
];

export default function Page() {
  const [t, setT] = useState(0);
  const [modelKey, setModelKey] = useState(MODELS[0].key);

  useEffect(() => {
    let id;
    const loop = (ts) => {
      setT(ts / 1000);
      id = requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const ascii = useMemo(() => {
    const model = MODELS.find((m) => m.key === modelKey) ?? MODELS[0];
    const buffer = Array(WIDTH * HEIGHT).fill(" ");
    const depth = Array(WIDTH * HEIGHT).fill(-Infinity);

    const ax = t * 0.7;
    const ay = t * 0.9;

    for (const { p, n } of model.points) {
      const rotatedP = rotatePoint(p, ax, ay);
      const rotatedN = rotateNormal(n, ax, ay);

      const z = rotatedP[2] + Z_OFFSET;
      if (z <= 0.1) continue;
      const invZ = 1 / z;

      const xProj = rotatedP[0] * invZ;
      const yProj = rotatedP[1] * invZ;

      const screenX = Math.floor(WIDTH / 2 + xProj * WIDTH * 0.6);
      const screenY = Math.floor(HEIGHT / 2 - yProj * HEIGHT * 0.6);

      if (screenX < 0 || screenX >= WIDTH || screenY < 0 || screenY >= HEIGHT) {
        continue;
      }

      const idx = screenY * WIDTH + screenX;
      if (invZ <= depth[idx]) continue;

      depth[idx] = invZ;

      const brightness = Math.max(
        0,
        rotatedN[0] * LIGHT_DIR[0] +
          rotatedN[1] * LIGHT_DIR[1] +
          rotatedN[2] * LIGHT_DIR[2]
      );
      const shadeIndex = Math.min(
        SHADES.length - 1,
        Math.floor(brightness * (SHADES.length - 1))
      );
      buffer[idx] = SHADES[shadeIndex];
    }

    const lines = [];
    for (let y = 0; y < HEIGHT; y++) {
      lines.push(buffer.slice(y * WIDTH, (y + 1) * WIDTH).join(""));
    }

    return lines.join("\n");
  }, [modelKey, t]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#0b1021",
        color: "#e0e0e0",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>ASCII Renderer</h1>
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span>Model:</span>
        <select
          value={modelKey}
          onChange={(e) => setModelKey(e.target.value)}
          style={{
            padding: "0.25rem 0.5rem",
            background: "#11162d",
            color: "#e0e0e0",
            border: "1px solid #243154",
          }}
        >
          {MODELS.map((model) => (
            <option key={model.key} value={model.key}>
              {model.label}
            </option>
          ))}
        </select>
      </label>
      <pre
        style={{
          margin: 0,
          padding: "1rem",
          lineHeight: 1,
          background: "#0f1430",
          border: "1px solid #1d2950",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
        aria-label="ASCII rendering"
      >
        {ascii}
      </pre>
    </main>
  );
}

function rotatePoint(p, ax, ay) {
  return rotateY(rotateX(p, ax), ay);
}

function rotateNormal(n, ax, ay) {
  return normalize(rotatePoint(n, ax, ay));
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

function makeCube(size = 1.5, step = 0.18, scale = [1, 1, 1]) {
  const points = [];
  const half = size;
  const ranges = [];
  for (let t = -half; t <= half; t += step) ranges.push(t);

  const faces = [
    { n: [1, 0, 0], p: (u, v) => [half * scale[0], u * scale[1], v * scale[2]] },
    { n: [-1, 0, 0], p: (u, v) => [-half * scale[0], u * scale[1], v * scale[2]] },
    { n: [0, 1, 0], p: (u, v) => [u * scale[0], half * scale[1], v * scale[2]] },
    { n: [0, -1, 0], p: (u, v) => [u * scale[0], -half * scale[1], v * scale[2]] },
    { n: [0, 0, 1], p: (u, v) => [u * scale[0], v * scale[1], half * scale[2]] },
    { n: [0, 0, -1], p: (u, v) => [u * scale[0], v * scale[1], -half * scale[2]] },
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

function makeTorus(R = 1.3, r = 0.4, stepMajor = 0.25, stepMinor = 0.25) {
  const points = [];
  for (let a = 0; a < Math.PI * 2; a += stepMajor) {
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    for (let b = 0; b < Math.PI * 2; b += stepMinor) {
      const cosB = Math.cos(b);
      const sinB = Math.sin(b);

      const x = (R + r * cosB) * cosA;
      const y = r * sinB;
      const z = (R + r * cosB) * sinA;

      const n = normalize([cosA * cosB, sinB, sinA * cosB]);
      points.push({ p: [x, y, z], n });
    }
  }
  return points;
}
