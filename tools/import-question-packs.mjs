import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PACK_DIR = path.join(ROOT, "authoring", "source-packs");
const REQUIRED = ["Course", "Topic", "Set", "Coverage", "Theme", "Difficulty", "Type", "Title", "Prompt", "A", "B", "C", "D", "Answer", "Authorities", "Explanation"];

function parsePack(file) {
  const text = fs.readFileSync(path.join(PACK_DIR, file), "utf8");
  return text.split(/^## /m).slice(1).map(block => {
    const [idLine, ...lines] = block.trim().split(/\r?\n/);
    const fields = {};
    for (const line of lines) {
      const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
      if (match) fields[match[1]] = match[2].trim();
    }
    const missing = REQUIRED.filter(key => !fields[key]);
    if (missing.length) throw new Error(`${file} ${idLine}: missing ${missing.join(", ")}`);
    const answer = fields.Answer.toUpperCase();
    if (!/^[A-D]$/.test(answer)) throw new Error(`${file} ${idLine}: invalid answer`);
    const explanation = fields.Explanation;
    const ruleMatch = explanation.match(/^Rule\.\s*([\s\S]*?)(?=\s+Application\.|$)/i);
    const appMatch = explanation.match(/Application\.\s*([\s\S]*?)(?=\s+Why the other choices fail\.|$)/i);
    const firstSentence = explanation.match(/^.*?[.!?](?:\s|$)/)?.[0] || explanation;
    return {
      id: idLine.trim(),
      course: fields.Course,
      topic: fields.Topic,
      set: fields.Set,
      coverage: fields.Coverage,
      theme: fields.Theme,
      difficulty: fields.Difficulty.toLowerCase(),
      type: fields.Type,
      title: fields.Title,
      prompt: fields.Prompt,
      choices: [fields.A, fields.B, fields.C, fields.D],
      correctIndex: answer.charCodeAt(0) - 65,
      explanation,
      source: `${fields.Set} · ${fields.Coverage}`,
      rule: (ruleMatch?.[1] || firstSentence).trim(),
      fullRule: explanation,
      caseRef: fields.Authorities,
      application: (appMatch?.[1] || explanation).trim(),
      conclusion: `The best answer is ${answer}.`,
      ruleKey: `${fields.Set.toLowerCase()}-${fields.Topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
    };
  });
}

const files = fs.readdirSync(PACK_DIR).filter(file => file.endsWith(".md")).sort();
const questions = files.flatMap(parsePack);
const ids = new Set();
for (const q of questions) {
  if (ids.has(q.id)) throw new Error(`Duplicate ID ${q.id}`);
  ids.add(q.id);
}

const sourceDocs = [...new Set(questions.map(q => q.set))];
const output = [
  `const FINALS_SOURCE_DOCS = ${JSON.stringify(sourceDocs, null, 2)};`,
  `const RAW_FINALS_QUESTIONS = ${JSON.stringify(questions, null, 2)};`,
  "const FINALS_QUESTIONS = RAW_FINALS_QUESTIONS;",
  ""
].join("\n\n");
fs.writeFileSync(path.join(ROOT, "questions.js"), output, "utf8");
console.log(JSON.stringify({ questions: questions.length, packs: sourceDocs, files }, null, 2));
