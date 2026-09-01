import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const failures = [];
const excludedDirectories = new Set(["node_modules", "_site", ".git"]);
const forbiddenNames = [/^\.env(?:\.|$)/i, /^id_rsa/i, /credentials?/i, /session/i, /cookie/i, /token/i];
const forbiddenText = [
  /[A-Z]:\\Users\\/i,
  new RegExp("\\\\My" + " Drive\\\\", "i"),
  /\/Users\/[^/]+\//,
  /\/home\/[^/]+\//,
  new RegExp("aint" + "funny18", "i"),
  new RegExp("Anthony" + " Woodside", "i"),
  /notebook\.google\.com/i,
  /ghp_[A-Za-z0-9]+/,
  /github_pat_[A-Za-z0-9_]+/,
  /AKIA[0-9A-Z]{16}/
];
const textExtensions = new Set([".md", ".txt", ".json", ".js", ".mjs", ".html", ".css", ".webmanifest", ".ps1", ".command"]);
const allowedRawSources = new Set([
  "sources/trademarks/Beebe-Trademark-Law-Open-Access.pdf",
  "sources/trademarks/Professor-Sipe-Fall-2026-Syllabus.docx",
  "sources/trademarks/Class-01-Slides-2026-08-17.pptx",
  "sources/trademarks/Class-02-Slides-2026-08-19.pptx",
  "sources/trademarks/Class-02-Reading-Casebook-pp-26-51.pdf",
  "sources/trademarks/Class-02-Canvas-Problem-1.md",
  "sources/trademarks/Class-03-Reading-Casebook-pp-51-67-and-71-88.pdf",
  "sources/con-crim-pro/Makar_Criminal Procedure Syllabus_F26_v1 (2026.07.23).docx",
  "sources/con-crim-pro/CCP1_Week1_What is a Search.pptx",
  "sources/con-crim-pro/CCP1_Class3_Search Cont'd (Chatrie_v1).pptx",
  "sources/con-crim-pro/CCP1_Week 2_Class 4_Warrant Execution_F26.pptx",
  "sources/con-crim-pro/Con_Crim_Pro_I_Outline.docx",
  "sources/con-crim-pro/Con Crim Pro I.docx",
  "sources/con-crim-pro/ConCrim_Hypo_Set_1_Fairhaven.docx",
  "sources/con-crim-pro/ConCrim_Hypo_Set_2_MillbrookRidge.docx",
  "sources/con-crim-pro/ConCrim_Hypo_Set_3_CedarHollow.docx",
  "sources/con-crim-pro/ConCrim_Hypo_Set_4_PortAlden_Capstone.docx",
  "sources/con-law-ii/Higginbotham_Con Law II_Fall 2026_Syllabus-1.docx",
  "sources/con-law-ii/Con Law II.docx",
  "sources/con-law-ii/Students for Fair Admissions v. President Fellows of Harvard College reading-1.pdf"
]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    const rel = path.relative(ROOT, full).replaceAll("\\", "/");
    if (entry.isDirectory()) walk(full); else files.push({ full, rel });
  }
}
walk(ROOT);

for (const { full, rel } of files) {
  if (forbiddenNames.some(pattern => pattern.test(path.basename(rel)))) failures.push(`forbidden filename: ${rel}`);
  if (/\.(pdf|docx|pptx|xlsx)$/i.test(rel) && !allowedRawSources.has(rel)) {
    failures.push(`unauthorized raw course/document file included: ${rel}`);
  }
  if (textExtensions.has(path.extname(rel).toLowerCase())) {
    const text = fs.readFileSync(full, "utf8");
    for (const pattern of forbiddenText) if (pattern.test(text)) failures.push(`private or secret pattern ${pattern.source} in ${rel}`);
  }
}

// sources/ is gitignored and never published, so it is legitimately absent in a fresh
// checkout (CI, or the published _site build). Only require every allowed raw source to
// be present when the sources/ directory itself exists, i.e. in the local authoring copy.
if (fs.existsSync(path.join(ROOT, "sources"))) {
  for (const expected of allowedRawSources) {
    if (!files.some(({ rel }) => rel === expected)) failures.push(`authorized source missing: ${expected}`);
  }
}

console.log(JSON.stringify({ scannedFiles: files.length, failures }, null, 2));
if (failures.length) process.exit(1);
