"use client";

import { useEffect, useMemo, useState } from "react";

const SHADES = "█▓▒░";

const MODELS = [
  {
    key: "cube",
    label: "Cube",
    sdf: (p) => boxSDF(p, 1.15),
  },
  {
    key: "wideCube",
    label: "Wide Cube",
    sdf: (p) => boxSDF(p, 1.5, [1.5, 1.0, 1.5]),
  },
  {
    key: "sphere",
    label: "Sphere",
    sdf: (p) => sphereSDF(p, 1.15),
  },
  {
    key: "torus",
    label: "Torus",
    sdf: (p) => torusSDF(p, 1.0, 0.45),
  },
];

function rotate(v, ax, ay) {
  let [x, y, z] = v;

  let x1 = x * Math.cos(ay) - z * Math.sin(ay);
  let z1 = x * Math.sin(ay) + z * Math.cos(ay);

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

function rotateInverse(v, ax, ay) {
  return rotate(v, -ax, -ay);
}

function cubeSDF([x, y, z]) {
  const s = 1;
  const dx = Math.max(Math.abs(x) - s, 0);
  const dy = Math.max(Math.abs(y) - s, 0);
  const dz = Math.max(Math.abs(z) - s, 0);
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function sphereSDF([x, y, z], r = 1) {
  return Math.hypot(x, y, z) - r;
}

function torusSDF([x, y, z], R = 1, r = 0.3) {
  const qx = Math.hypot(x, z) - R;
  return Math.hypot(qx, y) - r;
}

function getNormal(p, sdf) {
  const e = 0.002;
  const dx = cubeSDF([p[0] + e, p[1], p[2]]) - cubeSDF([p[0] - e, p[1], p[2]]);
  const dy = cubeSDF([p[0], p[1] + e, p[2]]) - cubeSDF([p[0], p[1] - e, p[2]]);
  const dz = cubeSDF([p[0], p[1], p[2] + e]) - cubeSDF([p[0], p[1], p[2] - e]);
  const len = Math.hypot(dx, dy, dz) || 1;
  return [dx / len, dy / len, dz / len];
}

export default function Page() {
  const [t, setT] = useState(0);
  const [modelKey, setModelKey] = useState(MODELS[0].key);

      const nx = cosI * cosJ;
      const ny = cosI * sinJ;
      const nz = sinI;

  useEffect(() => {
    let id;
    const loop = ts => {
      setT(ts/1000);
      id = requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const ascii = useMemo(() => {
    const model = MODELS.find(m => m.key === modelKey) ?? MODELS[0];
    const sdf = model.sdf;

    const result = [];

    const cam = [0,0,-3.5];
    const light = [0.6,1.0,-0.4];
    {
      const L = Math.hypot(...light);
      light[0]/=L; light[1]/=L; light[2]/=L;
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

        const aspect = W/H;
        const asciiAspect = 0.5;

        // Centered projection with corrected ASCII pixel aspect ratio
        let dir = [
          screenX * aspect,
          -screenY * asciiAspect,
          1
        ];

  for (const { p, n } of model.points) {
    const rotatedP = rotatePoint(p, ax, ay);
    const rotatedN = rotateNormal(n, ax, ay);

        let dist = 0;
        let pixel = " ";

    const screenX = Math.floor(WIDTH / 2 + xProj * WIDTH * 0.6);
    const screenY = Math.floor(HEIGHT / 2 - yProj * HEIGHT * 0.6);

          const pObj = rotateInverse(p, ax, ay);

          const d = cubeSDF(pObj);

          if (d < 0.01) {
            const nObj = getNormal(pObj);
            const nWorld = rotate(nObj, ax, ay);
            const diffuse = Math.max(0, nWorld[0]*light[0] + nWorld[1]*light[1] + nWorld[2]*light[2]);
            const idx = Math.floor(diffuse * (SHADES.length-1));
            pixel = SHADES[idx];
            break;
          }

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

    return result.join("\n");
  }, [t]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020408",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#cfffff",
      fontFamily: "monospace"
    }}>
    <div>
    <pre style={{
      fontSize: "10px",
      lineHeight: "10px",
      padding: "1.5rem",
      borderRadius: "12px",
      background: "#02040a",
      textShadow:"0 0 6px rgba(120,200,255,0.7)"
    }}>{ascii}</pre>
    </div>
    </div>
  );
}
