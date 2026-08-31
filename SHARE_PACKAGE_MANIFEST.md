# Share Package Manifest

## Purpose

Portable, customizable Law School Practice Lab starter prepared for Sabrina Pereira. Begin with `README.md`; Claude agents should then read `CLAUDE.md` and `INTAKE_CHECKLIST.md` before changing course content.

## Included

- Complete offline-ready web app and distinct Practice Lab icons.
- 38 original Trademarks and Unfair Competition questions, source-locked through the assigned Aug. 31, 2026 reading boundary.
- Four fictional demonstration questions for replacing with another course.
- Current Trademark authority, coverage, source, theme, answer-balance, and provisional Professor Sipe style-calibration ledgers.
- Authorized Trademark source bundle in `sources/trademarks/`: the open-access Beebe textbook, Professor Sipe's shared syllabus and available slides, assigned excerpts, and shared Class 2 problem.
- Beginner instructions for creating a free GitHub account, connecting GitHub to Claude, and publishing safely through GitHub Pages.
- Copyable Claude prompts, a customization helper, deployment workflow, and automated audits.

## Deliberately excluded

- Credentials, passwords, tokens, cookies, browser profiles, and private student files.
- Authenticated browser/session data and unrelated Canvas exports.
- An Aug. 31 Professor Sipe slide deck, which was not available when assembled. No coverage of that missing deck is claimed.
- Generated `_site`, dependency folders, and Git history.

The bundled professor-shared files retain their course links because the recipient is a classmate with access. The entire `sources/` directory is listed in `.gitignore` and excluded from the public `_site` artifact.

## Verified content

- Total questions: 42.
- Trademark questions: 38.
- Demo questions: 4.
- Question packs: 6.
- Duplicate IDs: 0.
- Overall correct-answer distribution: A 11, B 10, C 10, D 11.
- Trademark distribution: A 10, B 9, C 9, D 10.
- Demo distribution: A 1, B 1, C 1, D 1.

## Validation gates

The pre-archive package passed:

- question import and schema validation;
- UI/configuration tests;
- rule-number and named-authority telegraphing checks;
- duplicate-ID and answer-balance audit;
- package privacy/portability scan;
- binary source-container scan across 480 OOXML parts/payloads;
- explicit public-artifact allowlist audit;
- JavaScript syntax checks.

`FILE_INVENTORY_SHA256.txt` records a SHA-256 digest for every package file except the inventory itself. The final ZIP is separately extracted into a clean directory and retested before delivery.

## Safe publication boundary

Only the generated `_site` artifact belongs on GitHub Pages. Do not upload `sources/`. Before the first public repository upload, verify that `git status` lists nothing beneath `sources/`. Never paste a password, two-factor code, recovery code, token, or cookie into Claude or another chat.
