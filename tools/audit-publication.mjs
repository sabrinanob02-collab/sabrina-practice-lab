import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEST = path.join(ROOT, "_site");
const FILES = ["index.html", "styles.css", "app.js", "config.js", "rule-bank.js", "questions.js", "manifest.webmanifest", "service-worker.js", "offline.html"];
const ICONS = [
  "practice-lab-icon-192.png",
  "practice-lab-icon-512.png",
  "practice-lab-maskable-512.png",
  "practice-lab-apple-touch-180.png"
];
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(path.join(DEST, "assets", "icons"), { recursive: true });
for (const file of FILES) fs.copyFileSync(path.join(ROOT, file), path.join(DEST, file));
for (const icon of ICONS) fs.copyFileSync(path.join(ROOT, "assets", "icons", icon), path.join(DEST, "assets", "icons", icon));
fs.writeFileSync(path.join(DEST, ".nojekyll"), "", "utf8");

const failures = [];
const publicFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else publicFiles.push(full);
  }
}
walk(DEST);
for (const file of publicFiles) {
  const rel = path.relative(DEST, file).replaceAll("\\", "/");
  if (/\.(md|docx|pdf|txt|json)$/i.test(rel)) failures.push(`source/private extension published: ${rel}`);
  if (/\.(html|css|js|webmanifest)$/i.test(rel)) {
    const text = fs.readFileSync(file, "utf8");
    const privatePattern = new RegExp("[A-Z]:\\\\|\\\\My" + " Drive\\\\|Google Drive ID|Drive file ID|notebook\\.google\\.com|\\.docx\\b", "i");
    if (privatePattern.test(text)) failures.push(`private path or raw-source reference in ${rel}`);
  }
}
for (const forbidden of ["authoring", "config", "docs", "work", "data", "tools", "outputs"]) if (fs.existsSync(path.join(DEST, forbidden))) failures.push(`forbidden directory published: ${forbidden}`);
console.log(JSON.stringify({ artifactFiles: publicFiles.map(file => path.relative(DEST, file).replaceAll("\\", "/")), failures }, null, 2));
if (failures.length) process.exit(1);
