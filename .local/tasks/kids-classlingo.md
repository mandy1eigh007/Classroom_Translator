# ClassLingo Kids View

## What & Why
Add a separate student page designed for non-readers (pre-K, kindergarten, grade 1) in multilingual classrooms. Same teacher dashboard, same translation pipeline — but a child-friendly UI with no typing, no reading, big icons, auto-spoken translations, and avatar-based identity so the teacher can still see *which* kid needs help.

## Done looks like
- A new URL (e.g. `/kids?c=ROOMCODE`) the teacher can share alongside the regular student link.
- A child picks their language by tapping a flag and hearing the language name spoken aloud — no dropdown, no text.
- A child picks an animal avatar + first-name initial instead of typing a name.
- Every translated phrase from the teacher auto-plays via TTS the moment it arrives. The screen shows a calm animation (listening character / color pulse) instead of paragraphs of text. The translated text is still shown big, but it's secondary to the audio.
- Three giant icon-only buttons at the bottom:
  - 👂 Hear it again (replay last TTS)
  - 🙋 I need help (sends an alert to the teacher with the kid's avatar + initial)
  - 😊 I get it (positive signal, increments a counter on the teacher view)
- Teacher's dashboard shows raised-hand alerts with the kid's avatar + initial so they know who to check on. Existing alert UI extended, not replaced.
- A one-time "tap to start" gate on first load to unlock browser audio autoplay (required by Chrome/Safari).
- Works on shared school Chromebooks/iPads in a regular browser, no install.

## Out of scope
- Account logins, persistent profiles, or per-kid history. Avatar choice is per-session only.
- Document sharing, YouTube sync, class notes, and the "message the teacher" textarea — none of these make sense for non-readers and stay adult-only.
- Speech recognition from the kid (no kid mic). Communication kid→teacher is the three buttons only.
- New languages. Reuses the existing 16-language list. Languages with poor browser TTS quality (Somali, Dari, Amharic) will fall back to showing a friendly animation only; flag a known-limitation note in the teacher view.
- Native mobile app. Web only.

## Steps
1. **Kid identity & language flow** — A first-screen flow with flag tiles (tap a flag → hear the language name spoken in that language → confirm), then an avatar-picker grid (~12 animals) and a single-letter "what letter does your name start with" picker. Persist choice in `sessionStorage` only.
2. **Kid lesson view** — Full-screen layout: big listening character / pulse animation in the center, the translated phrase shown large below it, three giant icon buttons fixed at the bottom. Subscribes to the same SSE feed as the adult student page, filtered to the kid's chosen language.
3. **Auto-TTS pipeline** — On every translated utterance, automatically queue a `SpeechSynthesisUtterance` in the kid's language; replay button re-plays the last one. Include the "tap to start" audio unlock gate on first load. Gracefully fall back when no voice is installed for the kid's language (show animation only, mark the language with a soft "audio not available" icon in the picker).
4. **Help / understood signals** — "I need help" posts to the existing teacher-alert path with the kid's avatar id + initial attached; "I get it" posts a lightweight positive signal. Extend the teacher dashboard's existing alert list to render the avatar + initial inline, and add a small "understood" tally per recent utterance.
5. **Teacher share link** — Add a second share button on the teacher page ("Share kids link") that copies/QRs the `/kids` URL with the current room code, parallel to the existing student-link share.

## Relevant files
- `server.js`
- `public/student.html`
- `public/teach.html`
- `public/style.css`
