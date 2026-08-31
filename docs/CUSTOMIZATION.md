# Customization map

## App identity

Run `tools/bootstrap.mjs`, then check:

- `config/app-config.json`: title, short title, semester label, storage namespace, theme color, course names/colors, and deployment URL/account.
- `config.js`: generated browser-facing identity. Do not hand-edit after using the bootstrap helper.
- `manifest.webmanifest`: generated install name and theme information.

Use a unique lowercase `storageNamespace` so progress from two different apps cannot collide in the same browser.

## App icon

Replace all four PNG files in `assets/icons/` while preserving their filenames and dimensions:

- `practice-lab-apple-touch-180.png`: 180 × 180;
- `practice-lab-icon-192.png`: 192 × 192;
- `practice-lab-icon-512.png`: 512 × 512;
- `practice-lab-maskable-512.png`: 512 × 512 with important artwork inside the central safe area.

## Courses and colors

Add each course to `config/app-config.json`. The running filter is generated from the actual question bank, so the course name in each source pack must exactly match the configuration and ledger entries.

## Semester schedule

Maintain `config/semester-schedule.json`. Record dates, assigned pages, posted slides, exam dates, and deadlines only from current sources. A null value means unknown, not absent.

## Question bank

Follow `QUESTION_PACK_FORMAT.md`. Add Markdown packs under `authoring/source-packs/`, then run `npm run import`. Do not edit `questions.js` directly.

## Source and quality ledgers

- `authorities.json`: the private whitelist of course-supported authorities.
- `coverage.json`: classes, page ranges, gaps, cutoffs, and published sets.
- `source-manifest.json`: source descriptions and verification dates without private paths.
- `themes.json`: used settings to prevent factual repetition.
- `PROFESSOR_STYLE_CALIBRATION.md`: what is direct format evidence and what remains provisional.
- `config/quality-config.json`: balance tolerance and pre-answer telegraphing patterns.

## Deployment

Set your own GitHub username and repository in `config/app-config.json` or with `bootstrap.mjs`. The original package contains placeholders and no account credentials.
