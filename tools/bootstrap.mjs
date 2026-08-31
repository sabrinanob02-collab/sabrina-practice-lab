import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith("--") ? [value.slice(2), all[index + 1]] : null).filter(Boolean));
const required = ["title", "semester", "namespace"];
const missing = required.filter(key => !args[key] || args[key].startsWith("--"));
if (missing.length) {
  console.error("Usage: node tools/bootstrap.mjs --title \"My Practice Lab\" --semester \"Fall 2026\" --namespace \"my-practice-lab\" [--github-user USER] [--repo REPO]");
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]{2,50}$/.test(args.namespace)) throw new Error("namespace must be 3-51 lowercase letters, digits, or hyphens");

const configPath = path.join(ROOT, "config", "app-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.appTitle = args.title;
config.semesterLabel = args.semester;
config.storageNamespace = args.namespace;
if (args["github-user"] && !args["github-user"].startsWith("--")) config.deployment.githubUser = args["github-user"];
if (args.repo && !args.repo.startsWith("--")) config.deployment.repository = args.repo;
config.deployment.publicUrl = `https://${config.deployment.githubUser}.github.io/${config.deployment.repository}/`;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");

const js = `const PRACTICE_LAB_CONFIG = Object.freeze(${JSON.stringify({ appTitle: config.appTitle, shortTitle: config.shortTitle, semesterLabel: config.semesterLabel, tagline: config.tagline, storageNamespace: config.storageNamespace }, null, 2)});\n`;
fs.writeFileSync(path.join(ROOT, "config.js"), js, "utf8");

const manifestPath = path.join(ROOT, "manifest.webmanifest");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.name = config.appTitle;
manifest.short_name = config.shortTitle;
manifest.description = config.description;
manifest.theme_color = config.themeColor;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(JSON.stringify({ appTitle: config.appTitle, semesterLabel: config.semesterLabel, storageNamespace: config.storageNamespace, publicUrl: config.deployment.publicUrl }, null, 2));
