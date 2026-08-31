# Instructions for Claude agents

## Objective

Maintain a private-authoring, public-runtime law-school drill app that grows only from the student's verified current course materials.

## Controlling evidence

For every course update, reopen the current syllabus, assigned reading, posted slides, handouts, class notes, professor instructions, and any current-course practice materials. Current files control over summaries, prior agents, general legal knowledge, or older course copies.

## Source lock

- Test only doctrines and authorities found in the student's current assigned materials.
- Build or update `authoring/ledgers/authorities.json` before drafting.
- Record exact assigned ranges, overlaps, gaps, dates, and exclusions in `authoring/ledgers/coverage.json` and `source-manifest.json`.
- Do not silently bridge missing pages, unposted slides, or later material.
- Treat prior exams as style calibration and a content blacklist. They do not expand doctrinal scope.
- Never upload or publish raw source materials unless the student expressly authorizes it.

## Question quality

- Write original, coherent, fact-dense questions with exactly four close choices and one best answer.
- Increase difficulty through ambiguity, sequencing, competing inferences, and neighboring-rule distractors, not outside-course doctrine.
- Avoid lightly disguised assigned cases or prior questions. Do not reuse distinctive parties, products, transactions, timelines, or integrated factual engines.
- Keep case names, rule numbers, statutes, and other issue-identifying labels out of stems and choices when they would telegraph the answer. Exact authorities belong in `Authorities` and post-answer explanations.
- Explain the governing rule, apply the facts, and diagnose why meaningful distractors fail.
- Plan correct-answer positions before drafting. Keep each course and the full bank approximately balanced, with no conspicuous runs or mechanical A-B-C-D cycles.

## Professor calibration

Current-course exams, rubrics, and model answers control format when available. A prior exam from another course taught by the same professor may inform architecture, pacing, fact density, issue concealment, and distractor closeness only. Maintain a subject-matter firewall.

For the seeded Trademark course, read `authoring/ledgers/PROFESSOR_STYLE_CALIBRATION.md`. The calibration is provisional until direct current-course evidence appears.

## Course and schedule maintenance

- Keep `config/app-config.json` aligned with the courses actually present in the question bank.
- Keep `config/semester-schedule.json` aligned with the current syllabus and course site.
- Preserve meeting dates, page ranges, exam dates, deadlines, and known gaps separately; never infer a deadline from an older schedule.
- Add a new class meeting through the intake checklist before changing coverage.

## Authoring workflow

1. Inspect the current repository and confirm it is clean or preserve unrelated work.
2. Complete `INTAKE_CHECKLIST.md` for the course/class meeting.
3. Update the authority, source, coverage, and theme ledgers.
4. Draft in `authoring/source-packs/` using `QUESTION_PACK_FORMAT.md`.
5. Keep stable IDs for unchanged questions; use new IDs for materially new questions.
6. Run `npm run verify`.
7. Inspect the reported counts, duplicate IDs, answer distribution, private-data scan, syntax checks, and public-file whitelist.
8. Preview `_site` locally. Publish only after the student authorizes publication.

## Privacy and publication

The portable authoring package includes authorized Trademark sources in `sources/trademarks/`. The public artifact is `_site`, created from an explicit whitelist. It must not contain `authoring/`, `config/`, `docs/`, `sources/`, source PDFs, Word files, slides, notes, local paths, credentials, `.env` files, or authenticated links. The generated question JavaScript necessarily contains derivative questions and explanations.

Do not email, share, upload, commit, or deploy without the student's authorization. Never claim slide coverage when a deck is missing.

## Completion report

Report exact total and per-course counts, set counts, answer-position distributions, assigned coverage and exclusions, validation results, files changed, publication status, and residual limitations.
