import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const index = read("index.html");
const app = read("app.js");
const worker = read("service-worker.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
const config = JSON.parse(read("config/app-config.json"));
const failures = [];

for (const id of ["courseMultiBtn", "setSelect", "topicSelect", "modeSelect", "difficultyFilter", "timerSelect", "sessionSizeSelect", "startBtn", "answerList", "feedbackBox"]) {
  if (!index.includes(`id="${id}"`)) failures.push(`missing UI control ${id}`);
}
for (const script of ["config.js", "rule-bank.js", "questions.js", "app.js"]) if (!index.includes(`src="${script}"`)) failures.push(`missing script ${script}`);
for (const capability of ["missed", "flagged", "weak", "spaced"]) if (!app.includes(`mode === "${capability}"`)) failures.push(`missing ${capability} mode`);
if (!app.includes("entry.easeFactor") || !app.includes("entry.nextDue")) failures.push("missing spaced-review state");
if (!app.includes("STORAGE_NAMESPACE") || !app.includes("PRACTICE_LAB_CONFIG")) failures.push("app identity is not configuration-driven");
if (!worker.includes("questions.js") || !worker.includes("config.js") || !worker.includes("law-school-practice-lab-starter-v1")) failures.push("offline cache is incomplete or unversioned");
if (manifest.name !== config.appTitle) failures.push("manifest and app title mismatch");
console.log(JSON.stringify({ uiControls: 10, reviewModes: 4, configurableIdentity: true, failures }, null, 2));
if (failures.length) process.exit(1);
