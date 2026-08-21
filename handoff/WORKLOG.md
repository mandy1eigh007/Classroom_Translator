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

Date: 2026-08-21
Owner: Codex
Summary: Restored PDF sharing in the live instructor document flow and raised contrast for instructor share links, learner messages, and recently sent message text.
Files: functions/api/document.js, public/teach.html, public/site-rollout.css, handoff/WORKLOG.md
Validation: `node --check functions/api/document.js`, browser QA for PDF prep + mobile contrast, `npm run build`, and `git diff --check` passed.
Notes: PDF pages are prepared client-side with PDF.js, then stored through the existing Cloudflare document API. DOCX/PPTX still need export to PDF first.

Date: 2026-08-21
Owner: Codex
Summary: Fixed English-mode study tools and added a teacher-to-learner study-notes notice flow.
Files: functions/api/_lib.js, functions/api/define.js, functions/api/notes.js, functions/api/poll.js, functions/api/session.js, functions/api/studysheet.js, public/student.html, public/teach.html, handoff/WORKLOG.md
Validation: `node --check` on changed API functions, mocked notes publish/poll cycle, static Playwright visual checks for teacher/student study controls, `npm run build`, and `git diff --check` passed.
Notes: English study sheets and tap-to-define now stay in English. Teacher preview can send a learner notice; learners still generate localized notes from their Study panel and can copy/share/save/listen.

Date: 2026-08-21
Owner: Codex
Summary: Clarified the student vocabulary sheet label, made the readable English live line tappable for phrasebook saves, and removed dark text from instructor transcript/notes preview surfaces.
Files: public/student.html, public/site-rollout.css, handoff/WORKLOG.md
Validation: `npm run build`, `git diff --check`, and a Playwright behavior/style check for English word taps, phrasebook save, teacher live transcript color, and preview notes color passed.
Notes: The printable study sheet remains a vocabulary sheet. Student notes are generated from the Class notes panel above it.
