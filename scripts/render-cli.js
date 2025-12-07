#!/usr/bin/env node
import { MODELS, SHADES, renderAscii, hexToRgb } from "../lib/asciiRenderer.js";

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const idx = args.findIndex((a) => a === flag || a.startsWith(`${flag}=`));
  if (idx === -1) return fallback;
  const val = args[idx].includes("=") ? args[idx].split("=")[1] : args[idx + 1];
  return val ?? fallback;
};

const modelKey = getArg("--model", MODELS[0].key);
const width = parseInt(getArg("--width", "160"), 10);
const height = parseInt(getArg("--height", "60"), 10);
const frames = parseInt(getArg("--frames", "1"), 10);
const spin = parseFloat(getArg("--spin", "1.0"));

const selectedModel = MODELS.find((m) => m.key === modelKey);
if (!selectedModel) {
  console.error(`Unknown model '${modelKey}'. Available: ${MODELS.map((m) => m.key).join(", ")}`);
  process.exit(1);
}

function colorize(hex, text) {
  const [r, g, b] = hexToRgb(hex);
  return `\u001b[38;2;${r};${g};${b}m${text}\u001b[0m`;
}

function frameToString(lines) {
  return lines
    .map((row) => row.map(({ char, color }) => colorize(color, char === " " ? " " : char)).join("") + "\n")
    .join("");
}

let currentTime = 0;
for (let i = 0; i < frames; i++) {
  const ascii = renderAscii({ modelKey, t: currentTime, width, height, shades: SHADES });
  process.stdout.write(frameToString(ascii));
  if (i < frames - 1) {
    process.stdout.write("\u001b[2J\u001b[H");
  }
  currentTime += spin * 0.08;
}
