# Law School Practice Lab Starter

This is a portable, offline-ready law-school question-drill app. It supports course and topic filters, timed sessions, missed and flagged review, weak-area review, spaced repetition, explanations after answering, and device-local progress.

The package contains:

- a ready-to-use Trademarks and Unfair Competition bank with 38 vetted original questions, source-locked through the assigned Aug. 31, 2026 material;
- one fictional four-question demo course showing how to add another course safely;
- editable app, course, semester, source, coverage, and theme configuration;
- Claude-facing authoring rules and copyable prompts;
- automated question, privacy, publication, and offline checks.

The package also contains an authorized source bundle for the seeded Trademark course: the open-access Beebe textbook, Professor Sipe's shared syllabus and available slides, assigned reading excerpts, and the shared class problem. It contains no credentials, browser data, or private student files. Course-site links inside the professor-shared materials are preserved for a classmate who has access.

## Prerequisites

Install a current Long-Term Support version of [Node.js](https://nodejs.org/). Python 3 is optional but makes the local preview commands easy.

## Quickest local start

1. Extract the ZIP to a normal folder.
2. Open Terminal (Mac) or PowerShell (Windows) in that folder.
3. Run:

```text
npm install
npm run verify
npm run build
```

4. Start the local site:

Windows:

```text
powershell -ExecutionPolicy Bypass -File start-local.ps1
```

Mac:

```text
bash start-local.command
```

5. Open `http://127.0.0.1:4173/` in your browser.

Nothing is uploaded by these commands. Progress stays in that browser on that device.

## First customization

Run the identity helper once:

```text
node tools/bootstrap.mjs --title "Sabrina's Practice Lab" --semester "Fall 2026" --namespace "sabrina-practice-lab" --github-user YOUR_GITHUB_USERNAME --repo law-school-practice-lab
```

Then edit:

- `config/app-config.json` for the app title, course names/colors, and deployment account;
- `config/semester-schedule.json` for class meetings, assigned pages, exams, and deadlines;
- `assets/icons/` to replace the book-and-flask icon;
- `authoring/source-packs/` for question packs;
- `authoring/ledgers/` for sources, authority boundaries, coverage, and used themes.

See `docs/CUSTOMIZATION.md` for exact fields.

## Adding real course material

Use `INTAKE_CHECKLIST.md`, then give Claude the applicable prompt from `COPYABLE_PROMPTS.md`. Claude should read the current syllabus, assigned readings, slides, handouts, and notes before drafting. New raw source files may remain outside this project; only derivative questions and concise ledgers need to enter the package. The already-bundled Trademark sources are deliberately excluded from the publishable `_site` build.

After any question change, run:

```text
npm run verify
```

`questions.js` is generated. Do not edit it directly.

## Publishing

The app can be hosted free on GitHub Pages. Follow `docs/GITHUB_PAGES.md`. Publishing is optional, and source materials should never be committed merely to deploy the app.

## Important limitation

The seeded Trademark bank is reading-grounded through Aug. 31. It does not claim coverage of an Aug. 31 Professor Sipe slide deck because that deck was not available when this package was assembled. Before extending it, add authorized newly assigned readings and any later posted slides as described in `docs/TRADEMARKS_SOURCE_ACQUISITION.md`.
