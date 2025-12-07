"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_SEED = `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@                              @
@           DONUT!!!           @
@                              @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`.trim();

function normalizeSeed(seedString) {
  const lines = seedString.replace(/\r\n/g, "\n").split("\n");
  const width = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(width, " "));
}

function generateFractal(seedLines, width, height, depth, t) {
  const seedH = seedLines.length;
  const seedW = seedLines[0]?.length || 1;
  const lines = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      let ch = " ";
      for (let level = 0; level < depth; level++) {
        const scale = Math.pow(2, level);
        const fx = ((x + t * scale) * scale) / width;
        const fy = ((y + t * scale) * scale) / height;

        let sx = Math.floor((fx * seedW) % seedW);
        let sy = Math.floor((fy * seedH) % seedH);
        if (sx < 0) sx += seedW;
        if (sy < 0) sy += seedH;

        const c = seedLines[sy][sx];
        if (c !== " ") {
          ch = c;
          break;
        }
      }
      line += ch;
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export default function Page() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [depth, setDepth] = useState(4);
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(32);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let id;
    const loop = (ts) => {
      setTime(ts / 800);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  const seedLines = useMemo(() => normalizeSeed(seed), [seed]);

  const ascii = useMemo(
    () => generateFractal(seedLines, width, height, depth, time),
    [seedLines, width, height, depth, time]
  );

  return (
    <div style={{ padding: "1rem", fontFamily: "monospace", color: "#c6ffdd" }}>
      <h1>ASCII Fractal Renderer</h1>

      <textarea
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        style={{ width: "100%", height: "120px" }}
        spellCheck={false}
      />

      <div>
        Depth: {depth}
        <input type="range" min={1} max={7} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
      </div>

      <div>
        Width: {width}
        <input type="range" min={40} max={140} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
      </div>

      <div>
        Height: {height}
        <input type="range" min={16} max={60} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      </div>

      <pre style={{ fontSize: "10px", lineHeight: "10px", marginTop: "1rem" }}>
        {ascii}
      </pre>
    </div>
  );
}