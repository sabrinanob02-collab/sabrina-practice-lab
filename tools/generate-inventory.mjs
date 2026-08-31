import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = "FILE_INVENTORY_SHA256.txt";
const excludedDirectories = new Set(["node_modules", "_site", ".git"]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    const rel = path.relative(ROOT, full).replaceAll("\\", "/");
    if (entry.isDirectory()) walk(full);
    else if (rel !== OUTPUT) files.push({ full, rel });
  }
}

walk(ROOT);
const lines = files
  .sort((a, b) => a.rel.localeCompare(b.rel))
  .map(({ full, rel }) => `${crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex")}  ${rel}`);
fs.writeFileSync(path.join(ROOT, OUTPUT), `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ inventory: OUTPUT, files: lines.length }, null, 2));
