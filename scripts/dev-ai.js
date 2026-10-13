#!/usr/bin/env node
/**
 * Cross-platform AI service dev server launcher
 * Detects Windows vs POSIX virtual environment and launches uvicorn
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiDir = path.resolve(__dirname, "../ai-service");

const isWin = process.platform === "win32";
const venvUvicornWin = path.join(aiDir, ".venv", "Scripts", "uvicorn.exe");
const venvUvicornPosix = path.join(aiDir, ".venv", "bin", "uvicorn");

let cmd;
let args = ["app.main:app", "--reload", "--port", "8000"];

if (isWin && fs.existsSync(venvUvicornWin)) {
  cmd = venvUvicornWin;
} else if (!isWin && fs.existsSync(venvUvicornPosix)) {
  cmd = venvUvicornPosix;
} else {
  // Fallback to python -m uvicorn
  cmd = isWin ? "python" : "python3";
  args = ["-m", "uvicorn", ...args];
}

console.log(`[TenderLens AI] Launching AI service from: ${aiDir}`);
console.log(`[TenderLens AI] Command: ${cmd} ${args.join(" ")}`);

const child = spawn(cmd, args, {
  cwd: aiDir,
  stdio: "inherit",
  shell: isWin,
});

child.on("error", (err) => {
  console.error("[TenderLens AI] Failed to start:", err.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
