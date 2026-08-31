# Question Pack Format

Author questions in `authoring/source-packs/`. `questions.js` is generated output and must not be hand-edited.

Each question begins with a stable ID heading and includes every field below:

```text
## course-a-01-q01
Course: Full course name
Topic: Stable topic label
Set: COURSE-A-01
Coverage: Exact verified class/date/page boundary
Theme: New ledger-approved setting
Difficulty: hard
Type: mc
Title: Neutral title
Prompt: Original, fact-dense, nontelegraphing question.
A: Plausible choice.
B: Plausible choice.
C: Plausible choice.
D: Plausible choice.
Answer: B
Authorities: Exact course-supported authority labels
Explanation: Rule. ... Application. ... Why the other choices fail. ...
```

Quality rules:

- Current assigned course materials exclusively control doctrine and authorities.
- Treat prior exams as style calibration and a content blacklist, not as authority.
- Use original facts, exactly four close choices, and one best answer.
- Keep rule numbers, case names, statutes, and other issue-revealing labels out of prompts and choices when they would reveal the answer. Put authority labels after the learner answers.
- Balance answer positions within each course and across the full bank; avoid mechanical sequences.
- Preserve IDs unless the substance changes enough that saved progress should no longer attach.
- Update the authority, coverage, source, and theme ledgers with every pack.
- Run `npm run verify` before publication.
