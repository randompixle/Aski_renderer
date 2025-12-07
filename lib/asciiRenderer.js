export const SHADES = "█▓▒░ ";
export const DEFAULT_WIDTH = 140;
export const DEFAULT_HEIGHT = 52;
const Z_OFFSET = 6;
const LIGHT_DIR = normalize([0.35, 0.7, -0.55]);

const TEXTURE_COLORS = {
  cube: (p, n) => {
    const axis = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])];
    const maxAxis = axis.indexOf(Math.max(...axis));
    if (maxAxis === 0) return n[0] > 0 ? "#ff7b7b" : "#c56cff";
    if (maxAxis === 1) return n[1] > 0 ? "#6bffc2" : "#58c9ff";
    return n[2] > 0 ? "#ffd56c" : "#9be6ff";
  },
  wideCube: (p, n) => {
    const blend = Math.min(1, Math.max(0, (p[0] + 1.5) / 3));
    return mixColors("#d9ff6c", "#ff6cf3", blend);
  },
  sphere: (p) => {
    const bands = 0.5 + 0.5 * Math.sin(p[1] * 3.2 + p[0] * 1.4);
    return mixColors("#65d8ff", "#6c9bff", bands);
  },
  torus: (p) => {
    const angle = Math.atan2(p[2], p[0]);
    const stripe = 0.5 + 0.5 * Math.sin(angle * 4 + p[1] * 2);
    return mixColors("#ffd36c", "#ff6c8f", stripe);
  },
};

export const MODELS = [
  {
    key: "cube",
    label: "Cube",
    points: makeCube(1.6, 0.09, [1, 1, 1]),
  },
  {
    key: "wideCube",
    label: "Wide Cube",
    points: makeCube(1.6, 0.09, [1.5, 1.0, 1.5]),
  },
  {
    key: "sphere",
    label: "Sphere",
    points: makeSphere(1.7, 0.11, 0.11),
  },
  {
    key: "torus",
    label: "Torus",
    points: makeTorus(1.35, 0.45, 0.13, 0.13),
  },
];

export function renderAscii({
  modelKey = MODELS[0].key,
  t = 0,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  shades = SHADES,
}) {
  const model = MODELS.find((m) => m.key === modelKey) ?? MODELS[0];
  const brightnessBuffer = new Float32Array(width * height);
  const totalWeight = new Float32Array(width * height);
  const colorBuffer = new Array(width * height).fill(null);
  const depth = new Float32Array(width * height).fill(-Infinity);

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

    const screenXF = width / 2 + xProj * width * 0.7;
    const screenYF = height / 2 - yProj * height * 0.95;

    if (screenXF < -1 || screenXF >= width + 1 || screenYF < -1 || screenYF >= height + 1) {
      continue;
    }

    const baseX = Math.floor(screenXF);
    const baseY = Math.floor(screenYF);
    const fx = screenXF - baseX;
    const fy = screenYF - baseY;

    const brightness = Math.min(
      1,
      Math.max(
        0.18,
        rotatedN[0] * LIGHT_DIR[0] + rotatedN[1] * LIGHT_DIR[1] + rotatedN[2] * LIGHT_DIR[2]
      )
    );
    const colorHex = (TEXTURE_COLORS[model.key] ?? (() => "#e0e0e0"))(rotatedP, rotatedN);
    const [cr, cg, cb] = hexToRgb(colorHex);

    for (let iy = 0; iy <= 1; iy++) {
      for (let ix = 0; ix <= 1; ix++) {
        const px = baseX + ix;
        const py = baseY + iy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const weight = (ix === 0 ? 1 - fx : fx) * (iy === 0 ? 1 - fy : fy);
        if (weight <= 0) continue;

        const idx = py * width + px;
        const currentDepth = depth[idx];
        if (invZ > currentDepth + 0.02) {
          depth[idx] = invZ;
          brightnessBuffer[idx] = 0;
          totalWeight[idx] = 0;
          colorBuffer[idx] = [0, 0, 0];
        }

        if (Math.abs(invZ - depth[idx]) <= 0.02) {
          brightnessBuffer[idx] += brightness * weight;
          totalWeight[idx] += weight;
          if (!colorBuffer[idx]) colorBuffer[idx] = [0, 0, 0];
          colorBuffer[idx][0] += cr * weight;
          colorBuffer[idx][1] += cg * weight;
          colorBuffer[idx][2] += cb * weight;
        }
      }
    }
  }

  const smoothed = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const baseBrightness = totalWeight[idx] > 0 ? brightnessBuffer[idx] / totalWeight[idx] : 0;
      let total = baseBrightness * 2;
      let count = baseBrightness > 0 ? 2 : 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighborIdx = ny * width + nx;
          const nVal =
            totalWeight[neighborIdx] > 0 ? brightnessBuffer[neighborIdx] / totalWeight[neighborIdx] : 0;
          if (nVal > 0) {
            total += nVal;
            count += 1;
          }
        }
      }
      if (count > 0) {
        smoothed[y * width + x] = total / count;
      }
    }
  }

  const lines = [];
  for (let y = 0; y < height; y++) {
    const line = [];
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const b = smoothed[idx];
      const shadeIndex = Math.min(shades.length - 1, Math.floor((1 - b) * (shades.length - 1)));
      const char = shades[shadeIndex];
      const color =
        colorBuffer[idx] && totalWeight[idx] > 0
          ? rgbToHex(colorBuffer[idx].map((c) => c / totalWeight[idx]))
          : "#e0e0e0";
      line.push({ char, color });
    }
    lines.push(line);
  }

  return lines;
}

export function rotatePoint(p, ax, ay) {
  return rotateY(rotateX(p, ax), ay);
}

export function rotateNormal(n, ax, ay) {
  return normalize(rotatePoint(n, ax, ay));
}

export function rotateX([x, y, z], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x, y * c - z * s, y * s + z * c];
}

export function rotateY([x, y, z], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c + z * s, y, -x * s + z * c];
}

export function makeSphere(radius = 1.6, stepLat = 0.1, stepLon = 0.1) {
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

export function makeCube(size = 1.5, step = 0.1, scale = [1, 1, 1]) {
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

export function makeTorus(R = 1.3, r = 0.4, stepMajor = 0.15, stepMinor = 0.15) {
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

export function hexToRgb(hex) {
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  const int = parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgbToHex([r, g, b]) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}

export function mixColors(a, b, t) {
  const clampT = Math.min(1, Math.max(0, t));
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = ar + (br - ar) * clampT;
  const g = ag + (bg - ag) * clampT;
  const bVal = ab + (bb - ab) * clampT;
  return rgbToHex([r, g, bVal]);
}

export function normalize(v) {
  const len = Math.hypot(...v) || 1;
  return v.map((n) => n / len);
}
