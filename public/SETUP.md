# ClassLingo — deployment setup

Everything below goes in the Cloudflare dashboard for the Pages project
(`Workers & Pages -> [project] -> Settings`). Set each variable for BOTH
Production and Preview.

## Environment variables

| Variable | Status | Value / where to get it |
|---|---|---|
| `OPENAI_API_KEY` | already set | OpenAI API key — translation, notes, TTS, Whisper, OCR |
| `TEACHER_PASSWORD` | already set | Instructor passcode for /teach |
| `SUPABASE_URL` | add | `https://lfizcpaqolckemrvsooy.supabase.co` |
| `SUPABASE_ANON_KEY` | add | The anon/public key from Supabase dashboard -> Settings -> API. Safe for client-side use (RLS enforces access). Also baked into `/public/supabase-config.js`. |
| `SUPABASE_SERVICE_ROLE_KEY` | add | Supabase dashboard -> Settings -> API -> `service_role` key. **Keep secret — server-side only, never in client code or git.** Needed for the follow-up server-side auth verification in `/functions/api/`. |
| `MYMEMORY_EMAIL` | optional | Contact email for the free MyMemory translation fallback (raises the free quota from 10k to 50k chars/day). |

## KV bindings

Already wired in `wrangler.toml`; if the Pages project was created from the
dashboard, also add them under Settings -> Bindings:

| Binding | Namespace | ID |
|---|---|---|
| `SESSION_KV` | classlingo-session | `3b3706c8f3114a91a887186cb34db1c7` |
| `PHRASEBOOK_KV` | classlingo-phrasebook | `6668697d2717492ea1c7fdc4a78ba0cf` |

## Supabase (project: 2BlackFeathers / lfizcpaqolckemrvsooy)

1. Apply the schema: `supabase db push` (migration lives at
   `supabase/migrations/001_classlingo_schema.sql`).
2. Create your admin account: Supabase dashboard -> Authentication -> Users
   -> Add user (email + password), then run this SQL once (SQL editor):

   ```sql
   insert into cl_profiles (id, role, display_name, email)
   values ('<the-new-user-uuid>', 'admin', 'Mandy', '<the-email>');
   ```

3. Sign in at `/admin` with that account.
4. Optional: Authentication -> Providers -> Email — turning OFF "Confirm
   email" makes instructor creation from the admin panel fully self-service
   (with confirmation on, new instructors must confirm before their profile
   activates).

## Pages

- `/` — landing
- `/teach` — instructor (passcode-gated; mode selector, classroom grid, export)
- `/student` — learner view
- `/dispatch` — field-team dispatch view
- `/admin` — owner console (Supabase Auth, role `admin` required)
