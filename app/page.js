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

  let y1 = y * Math.cos(ax) - z1 * Math.sin(ax);
  let z2 = y * Math.sin(ax) + z1 * Math.cos(ax);

  return [x1, y1, z2];
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

  const W = 110;
  const H = 55;

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

    const ax = t*0.7;
    const ay = t*0.9;

    for (let y=0; y<H; y++) {
      let row = "";

      for (let x=0; x<W; x++) {
        const screenX = ((x+0.5)/W)*2 - 1;
        const screenY = ((y+0.5)/H)*2 - 1;

        const aspect = W/H;
        const asciiAspect = 0.5;

        // Centered projection with corrected ASCII pixel aspect ratio
        let dir = [
          screenX * aspect,
          -screenY * asciiAspect,
          1
        ];

        const len = Math.hypot(...dir);
        dir = [dir[0]/len, dir[1]/len, dir[2]/len];

        let dist = 0;
        let pixel = " ";

        for (let i=0; i<80; i++) {
          const p = [
            cam[0] + dir[0]*dist,
            cam[1] + dir[1]*dist,
            cam[2] + dir[2]*dist,
          ];

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

          dist += d * 0.5;
          if (dist > 10) break;
        }

        row += pixel;
      }

      result.push(row);
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
