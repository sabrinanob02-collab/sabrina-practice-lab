import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(import.meta.dirname, "..");
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, "questions.js"), "utf8") + "\nthis.Q=FINALS_QUESTIONS;this.D=FINALS_SOURCE_DOCS;", context);
const questions = context.Q;
const packs = context.D;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "app-config.json"), "utf8"));
const quality = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "quality-config.json"), "utf8"));
const failures = [];
const ids = new Set();
const required = ["id", "course", "topic", "set", "coverage", "difficulty", "type", "prompt", "explanation", "source", "rule", "fullRule", "caseRef", "application", "conclusion", "ruleKey"];
const forbiddenPatterns = quality.forbiddenQuestionSurfacePatterns.map(pattern => new RegExp(pattern, "i"));

for (const q of questions) {
  if (ids.has(q.id)) failures.push(`duplicate ID ${q.id}`);
  ids.add(q.id);
  for (const field of required) if (!String(q[field] || "").trim()) failures.push(`${q.id} missing ${field}`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some(choice => !choice.trim())) failures.push(`${q.id} invalid choices`);
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) failures.push(`${q.id} invalid correctIndex`);
  const questionSurface = [q.prompt, ...q.choices].join(" ");
  if (/professor-style|on an exam|a student must|call of the question/i.test(questionSurface)) failures.push(`${q.id} meta-framed question`);
  for (const pattern of forbiddenPatterns) if (pattern.test(questionSurface)) failures.push(`${q.id} contains a configured telegraphing pattern: ${pattern.source}`);
  const privatePattern = new RegExp("[A-Z]:\\\\|\\\\My" + " Drive\\\\|\\.docx\\b|Drive file ID|notebook\\.google\\.com", "i");
  if (privatePattern.test(JSON.stringify(q))) failures.push(`${q.id} private/source leakage`);
}

const counts = questions.reduce((acc, q) => ((acc[q.set] = (acc[q.set] || 0) + 1), acc), {});
const courseCounts = questions.reduce((acc, q) => ((acc[q.course] = (acc[q.course] || 0) + 1), acc), {});
const answerDistribution = questions.reduce((acc, q) => { const letter = String.fromCharCode(65 + q.correctIndex); acc[letter] = (acc[letter] || 0) + 1; return acc; }, {});
const courseAnswerDistribution = questions.reduce((acc, q) => { const letter = String.fromCharCode(65 + q.correctIndex); acc[q.course] ||= { A: 0, B: 0, C: 0, D: 0 }; acc[q.course][letter] += 1; return acc; }, {});

for (const [course, expected] of Object.entries(config.expectedQuestionCounts || {})) {
  if (courseCounts[course] !== expected) failures.push(`${course}: expected ${expected} questions, got ${courseCounts[course] || 0}`);
}
if (packs.length !== Object.keys(counts).length) failures.push("source-pack inventory mismatch");
for (const [course, distribution] of Object.entries(courseAnswerDistribution)) {
  const values = Object.values(distribution);
  if (Math.max(...values) - Math.min(...values) > quality.maximumAnswerImbalance) failures.push(`${course}: answer positions are not balanced`);
}

console.log(JSON.stringify({ total: questions.length, packs, counts, courseCounts, answerDistribution, courseAnswerDistribution, duplicateIds: questions.length - ids.size, failures }, null, 2));
if (failures.length) process.exit(1);
