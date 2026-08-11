# Decisions

Record meaningful technical decisions and why they were made.

## Entry Template
Date: YYYY-MM-DD
Decision: <what>
Context: <problem/constraint>
Options Considered: <short list>
Chosen Approach: <what was selected>
Rationale: <why>
Impact: <tradeoffs, follow-up tasks>

---

Date: 2026-06-07
Decision: Start structured handoff documentation in-repo.
Context: Project history was partially recovered from Replit exports.
Options Considered: ad-hoc notes, external docs, in-repo handoff folder.
Chosen Approach: in-repo handoff folder with standard logs.
Rationale: Keeps context close to code and versioned from now on.
Impact: Team must maintain logs during normal development flow.

Date: 2026-08-11
Decision: Publish high-confidence mined trade-language terms from one independent source and send lower-confidence or uncertain terms to admin review.
Context: The previous three-source gate extracted candidates but published no phrases, making the scheduled miner appear stalled.
Options Considered: keep three-source gate, lower confidence only, one-source auto-publish with admin review fallback.
Chosen Approach: one-source auto-publish at the configured confidence threshold; all weaker/uncertain items stay visible in admin review.
Rationale: Trade-language learning needs useful terms to reach the translator quickly while still keeping uncertain terms out of the active lexicon.
Impact: Admin review volume increases, but hidden candidate buildup is avoided.
