import React from 'react';
import {
  HardHat,
  Mic,
  FileText,
  Youtube,
  Languages,
  ShieldCheck,
  Volume2,
  Pause,
  RotateCcw,
  Type,
  ScanLine,
  ArrowRight,
} from 'lucide-react';
import './pastel-neon.css';

const HERO_IMAGE = '/__mockup/images/classlingo-neon-hero.png';
const PROFILE_IMAGE = '/__mockup/images/classlingo-neon-portrait.png';
const ACCENT_IMAGE = '/__mockup/images/classlingo-neon-accent.png';

const features = [
  { icon: Languages, title: 'LIVE TRANSLATION', copy: 'You speak English. Trainees follow in their own language in real time.' },
  { icon: Mic, title: 'MIC PAUSE / RESUME', copy: 'Hit pause to talk side conversation, resume when you’re back on topic.' },
  { icon: FileText, title: 'SHARE DOCS', copy: 'Drop PDFs, DOCX, TXT, or photos. Each page is translated per language.' },
  { icon: ScanLine, title: 'OCR ON IMAGES', copy: 'Snap a spec sheet or jobsite photo — text is read and translated.' },
  { icon: Youtube, title: 'SYNCED YOUTUBE', copy: 'Play a safety video; every trainee watches in sync on their phone.' },
  { icon: ShieldCheck, title: 'EPHEMERAL', copy: 'No accounts, nothing stored after class. Privacy by default.' },
];

const trainee = [
  { icon: Languages, label: 'Pick your language' },
  { icon: Volume2, label: 'Tap to hear (TTS)' },
  { icon: Pause, label: 'Hold to pause incoming text' },
  { icon: RotateCcw, label: 'Replay anything you missed' },
  { icon: Type, label: 'Bump font size up' },
];

export function Pastel() {
  return (
    <div className="neon-theme relative min-h-screen w-full overflow-hidden bg-[#050617] text-white selection:bg-[#00f0ff]/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,240,255,0.16),transparent_32%),radial-gradient(circle_at_75%_0%,rgba(255,0,255,0.18),transparent_34%),linear-gradient(180deg,#050617_0%,#08071f_42%,#050617_100%)]" />
      <div className="pointer-events-none fixed left-[-10%] top-[12%] z-0 h-[520px] w-[520px] rounded-full bg-[#00f0ff]/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-8%] z-0 h-[640px] w-[640px] rounded-full bg-[#ff00ff]/10 blur-[140px]" />

      <nav className="sticky top-0 z-50 border-b border-[#00f0ff]/10 bg-[#050617]/78 px-6 py-5 backdrop-blur-xl lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#00f0ff]/45 bg-[#00f0ff]/10 shadow-[0_0_24px_rgba(0,240,255,0.22)]">
              <HardHat className="h-5 w-5 text-[#00f0ff]" strokeWidth={1.6} />
            </div>
            <div className="leading-none">
              <div className="text-lg font-black tracking-[0.2em] text-white">CLASS LINGO</div>
              <div className="mt-1 text-[0.62rem] font-bold tracking-[0.36em] text-[#00f0ff]">CONSTRUCTION</div>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/teach"
              className="hidden sm:inline-flex items-center rounded-lg border border-[#00f0ff]/60 bg-[#00f0ff]/5 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#00f0ff] transition hover:bg-[#00f0ff]/12"
            >
              Instructor
            </a>
            <a
              href="/student"
              className="inline-flex items-center rounded-lg border border-[#ff00ff]/60 bg-[#ff00ff]/5 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#ff00ff] transition hover:bg-[#ff00ff]/12"
            >
              Trainee
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 py-20 lg:px-10 lg:py-28">
          <div
            className="pointer-events-none absolute inset-y-0 right-[-18%] z-0 w-[118%] opacity-45 mix-blend-screen sm:right-[-10%] sm:w-[100%] sm:opacity-70 lg:right-[-3%] lg:w-[73%] lg:opacity-95"
            aria-hidden="true"
            style={{
              backgroundImage: `url(${HERO_IMAGE})`,
              backgroundPosition: 'center right',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              WebkitMaskImage: 'radial-gradient(ellipse 76% 74% at 74% 52%, black 32%, transparent 78%)',
              maskImage: 'radial-gradient(ellipse 76% 74% at 74% 52%, black 32%, transparent 78%)',
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-[linear-gradient(90deg,rgba(5,6,23,0.96)_0%,rgba(5,6,23,0.88)_38%,rgba(5,6,23,0.45)_70%,rgba(5,6,23,0.1)_100%)] lg:w-[68%]" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#00f0ff]/25 bg-[#00f0ff]/8 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_14px_#00f0ff]" />
                <span className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#00f0ff]">Live Jobsite Translation</span>
              </div>

              <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Build Smarter.
                <br />
                <span className="text-[#00f0ff] drop-shadow-[0_0_22px_rgba(0,240,255,0.58)]">Work Together.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
                You teach the class in English. Every trainee follows live in their own language — no accounts, no app to install, nothing stored after class.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="/teach"
                  className="group inline-flex items-center gap-3 rounded-lg border border-[#00f0ff] bg-[#00f0ff]/5 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#00f0ff] shadow-[0_0_28px_rgba(0,240,255,0.14)] transition hover:bg-[#00f0ff]/12 hover:shadow-[0_0_36px_rgba(0,240,255,0.28)]"
                >
                  I'm Instructing
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" strokeWidth={2.2} />
                </a>
                <a
                  href="/student"
                  className="inline-flex items-center rounded-lg border border-[#ff00ff] bg-[#ff00ff]/5 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#ff00ff] shadow-[0_0_28px_rgba(255,0,255,0.14)] transition hover:bg-[#ff00ff]/12 hover:shadow-[0_0_36px_rgba(255,0,255,0.28)]"
                >
                  I'm a Trainee
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE GRID — real app features only */}
        <section className="relative z-20 border-y border-[#00f0ff]/10 bg-[#070822]/72 px-6 py-14 backdrop-blur-xl lg:px-10 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">What it does</h2>
              <span className="hidden text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#00f0ff] sm:inline">Six things, nothing extra</span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group flex gap-4 rounded-2xl border border-[#00f0ff]/12 bg-[#07102c]/58 p-6 transition hover:border-[#00f0ff]/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)]"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#00f0ff]/25 bg-[#00f0ff]/8 transition group-hover:border-[#00f0ff]/70">
                    <f.icon className="h-5 w-5 text-[#00f0ff]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{f.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TWO-UP: Instructor + Trainee — what each side actually sees */}
        <section className="px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Instructor */}
            <div className="relative overflow-hidden rounded-2xl border border-[#00f0ff]/14 bg-[#07102c]/58 p-8 backdrop-blur-xl lg:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-55 mix-blend-screen"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${PROFILE_IMAGE})`,
                  backgroundPosition: 'right center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 80% 50%, black 0%, transparent 75%)',
                  maskImage: 'radial-gradient(ellipse 70% 80% at 80% 50%, black 0%, transparent 75%)',
                }}
              />
              <div className="relative z-10 max-w-md">
                <span className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-[#00f0ff]">Instructor — /teach</span>
                <h3 className="mt-3 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                  Talk. <span className="text-[#00f0ff] drop-shadow-[0_0_18px_rgba(0,240,255,0.5)]">Share.</span> Done.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/68">
                  Sign in with the teacher passcode, throw the QR on the screen, and start talking. Pause the mic anytime. Drop a PDF, photo, or YouTube link and everyone follows along — in their language, in sync.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/78">
                  <li className="flex items-center gap-3"><Mic className="h-4 w-4 text-[#00f0ff]" strokeWidth={1.6} /> Mic pause / resume</li>
                  <li className="flex items-center gap-3"><FileText className="h-4 w-4 text-[#00f0ff]" strokeWidth={1.6} /> PDF / DOCX / TXT / images — per-page translation + OCR</li>
                  <li className="flex items-center gap-3"><Youtube className="h-4 w-4 text-[#00f0ff]" strokeWidth={1.6} /> Synced YouTube playback</li>
                </ul>
                <a
                  href="/teach"
                  className="mt-8 inline-flex items-center gap-3 rounded-lg border border-[#00f0ff] bg-[#00f0ff]/5 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#00f0ff] transition hover:bg-[#00f0ff]/12"
                >
                  Open Instructor View <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </a>
              </div>
            </div>

            {/* Trainee */}
            <div className="relative overflow-hidden rounded-2xl border border-[#ff00ff]/14 bg-[#07102c]/58 p-8 backdrop-blur-xl lg:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-45 mix-blend-screen"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${ACCENT_IMAGE})`,
                  backgroundPosition: 'right center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 80% 50%, black 0%, transparent 75%)',
                  maskImage: 'radial-gradient(ellipse 70% 80% at 80% 50%, black 0%, transparent 75%)',
                }}
              />
              <div className="relative z-10 max-w-md">
                <span className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-[#ff00ff]">Trainee — /student</span>
                <h3 className="mt-3 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">
                  Pick a language. <span className="text-[#ff00ff] drop-shadow-[0_0_18px_rgba(255,0,255,0.5)]">Follow along.</span>
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/68">
                  Open the link on your phone, pick your language, and read along live. Tap to hear it out loud, hold to pause, hit replay if you missed something, bump the font size up — whatever you need.
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-white/78 sm:grid-cols-2">
                  {trainee.map((t) => (
                    <li key={t.label} className="flex items-center gap-3">
                      <t.icon className="h-4 w-4 text-[#ff00ff]" strokeWidth={1.6} /> {t.label}
                    </li>
                  ))}
                </ul>
                <a
                  href="/student"
                  className="mt-8 inline-flex items-center gap-3 rounded-lg border border-[#ff00ff] bg-[#ff00ff]/5 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff00ff] transition hover:bg-[#ff00ff]/12"
                >
                  Join as Trainee <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="px-6 pb-20 lg:px-10 lg:pb-28">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-2xl border border-[#00f0ff]/14 bg-[#07102c]/62 p-7 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between lg:p-9">
            <div className="flex items-start gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/8">
                <Languages className="h-7 w-7 text-[#00f0ff]" strokeWidth={1.4} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide text-white">Ready when you are.</h2>
                <p className="mt-2 text-white/58">Open the instructor view to start a session, or join as a trainee with a class link.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/teach"
                className="inline-flex justify-center rounded-lg border border-[#00f0ff] bg-[#00f0ff]/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#00f0ff] transition hover:bg-[#00f0ff]/12"
              >
                Instructor
              </a>
              <a
                href="/student"
                className="inline-flex justify-center rounded-lg border border-[#ff00ff] bg-[#ff00ff]/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff00ff] transition hover:bg-[#ff00ff]/12"
              >
                Trainee
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#00f0ff]/10 bg-[#050617] px-6 py-10 text-center text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white/34 lg:px-10">
        © {new Date().getFullYear()} Class Lingo · Pre-Apprentice Construction
      </footer>
    </div>
  );
}

export default Pastel;
