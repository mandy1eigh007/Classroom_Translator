# Work Log

Use this file to document all changes from 2026-06-07 onward.

## Entry Template
Date: YYYY-MM-DD
Owner: <name>
Summary: <what changed>
Files: <paths changed>
Validation: <tests/checks run>
Notes: <risks/follow-ups>

---

Date: 2026-06-07
Owner: Copilot
Summary: Initialized handoff documentation structure and policy.
Files: handoff/README.md, handoff/WORKLOG.md, handoff/DECISIONS.md, handoff/HISTORY_RECOVERY.md
Validation: Created files and confirmed exports files are present.
Notes: All future changes should be logged here.

Date: 2026-06-07
Owner: Copilot
Summary: Added pre-commit checklist and linked it from handoff index.
Files: handoff/CHECKLIST.md, handoff/README.md, handoff/WORKLOG.md
Validation: Created checklist file and updated references.
Notes: Checklist should be used before each commit.

Date: 2026-08-11
Owner: Codex
Summary: Adjusted video mining so high-confidence trade-language candidates can publish, uncertain terms route to admin review, queued videos process before discovery, and non-English caption tracks can be selected.
Files: functions/api/_video_mining.js, functions/api/_youtube.js, public/admin.html, tests/video-mining.test.mjs, handoff/WORKLOG.md, handoff/DECISIONS.md
Validation: `npm run test:mining`, `npm run build`, and `git diff --check` passed.
Notes: Live database backfill was already completed separately: 65 active mined phrases and 302 review items.
