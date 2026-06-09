# Pre-Commit Checklist

Use this checklist before every commit.

1. Scope is clear and limited to intended files.
2. Changes are documented in WORKLOG.md.
3. Any important tradeoff is recorded in DECISIONS.md.
4. Local validation completed (run/build/tests relevant to change).
5. No secrets or sensitive data introduced.
6. No accidental large/binary files added unless intentional.
7. Recovery context considered when touching legacy areas from Replit export.
8. Commit message summarizes intent and impact.

## Quick Commit Note Template
Date: YYYY-MM-DD
Change: <short summary>
Validation: <commands/checks>
Risk: <low/medium/high + note>
