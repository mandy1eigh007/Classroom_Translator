# English as a selectable language

## What & Why
Right now the teacher speaks English and students pick a *different* language to receive the translation. There's no way to pick English on either the adult or kids student view, which makes it impossible for you to test the full student flow without speaking another language. Add English as a selectable option on both views, purely as a passthrough (no actual translation work).

## Done looks like
- The adult student page (`/student`) has "English" as the first option in the language dropdown.
- The kids page (`/kids`) has an English flag tile (🇺🇸 or 🇬🇧 — your call, default 🇺🇸) in the flag picker. When tapped, it speaks "English" aloud just like the other flags.
- When English is selected, every utterance the teacher publishes appears in the student feed instantly with the original English text — no OpenAI/MyMemory call, no translation latency, no cost.
- Auto-TTS on the kids page reads the English text aloud using the browser's English voice.
- The teacher dashboard shows English-selected students in the same list as other languages (so you can see "1 English, 2 Spanish, 1 Somali" etc).
- "Read aloud," "Replay," and the kids "👂 Hear it again" button all work with English voices.
- Class notes generated for English-selected students still work (this already works server-side as of the teacher preview feature — just confirm).

## Out of scope
- Reverse direction (Spanish-speaking teacher, English-receiving student). Teacher is still assumed to be speaking English.
- Adding more English variants (UK/AU/CA). One English entry only.
- Any UI relabeling for non-test classroom use — this is for testing but is also harmless in production, so leave it visible.

## Steps
1. **Server: add English to the language list** — Add `'English': 'en'` to the language code table. In the translation entry point, short-circuit when the target language is English: skip both OpenAI and MyMemory and return the source text unchanged. This avoids cost and round-trip latency for English-selected students.
2. **Adult student dropdown** — Add "English" as the first option (above Spanish) in the language `<select>`. Confirm the `lang` value persists in localStorage and survives reload like every other language.
3. **Kids flag picker** — Add an English flag tile to the flag grid. Pick a sensible spoken-name ("English") and use the browser's default English voice for the "tap a flag, hear the name" feedback. Confirm the avatar/letter flow continues normally after picking English.
4. **Sanity-check existing English paths** — Verify the teacher's class-notes preview (which already accepts `lang=English`) still works, and that the teacher dashboard correctly groups English students alongside other languages.

## Relevant files
- `server.js`
- `public/student.html`
- `public/kids.html`
- `public/teach.html`
