"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  MODELS,
  SHADES,
  renderAscii,
} from "../lib/asciiRenderer";

const WIDTH = DEFAULT_WIDTH;
const HEIGHT = DEFAULT_HEIGHT;

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
    return renderAscii({ modelKey, t, width: WIDTH, height: HEIGHT, shades: SHADES });
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
        fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
        padding: "1.5rem 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.4rem", margin: 0 }}>ASCII Renderer</h1>
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
          padding: "0.8rem 0.6rem",
          lineHeight: "0.82em",
          letterSpacing: "-0.08em",
          fontSize: "10px",
          background: "#0f1430",
          border: "1px solid #1d2950",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          overflow: "auto",
        }}
        aria-label="ASCII rendering"
      >
        {ascii.map((row, y) => (
          <span key={y}>
            {row.map(({ char, color }, x) => (
              <span key={`${y}-${x}`} style={{ color }}>
                {char === " " ? "\u00a0" : char}
              </span>
            ))}
            {"\n"}
          </span>
        ))}
      </pre>
    </main>
  );
}
