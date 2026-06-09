import React from "react";
import { Mic, Globe2, Sparkles, Languages, Volume2, FileText, ChevronRight, Lock } from "lucide-react";
import "./Glass.css";

export function Glass() {
  return (
    <div className="min-h-screen bg-[#050511] text-zinc-100 font-sans relative overflow-hidden selection:bg-cyan-500/30">
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      
      {/* Background Glows */}
      <div className="glow-blob glow-purple w-[600px] h-[600px] top-[-200px] left-[-100px] opacity-60"></div>
      <div className="glow-blob glow-cyan w-[500px] h-[500px] top-[20%] right-[-100px] opacity-40"></div>
      <div className="glow-blob glow-purple w-[700px] h-[700px] bottom-[-200px] left-[20%] opacity-30"></div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-x-0 border-t-0 border-b-[1px] border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-['Space_Grotesk'] font-bold text-xl tracking-tight">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          ClassLingo
        </div>
        <div className="flex items-center gap-4">
          <a href="/teach" className="text-sm font-['DM_Mono'] text-zinc-400 hover:text-zinc-100 transition-colors">/teach</a>
          <a href="/student" className="text-sm font-['DM_Mono'] text-zinc-400 hover:text-zinc-100 transition-colors">/student</a>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-['DM_Mono'] text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Live classroom translation
          </div>
          <h1 className="text-5xl lg:text-7xl font-['Space_Grotesk'] font-bold leading-[1.1] tracking-tight">
            Speak English.<br />
            <span className="text-gradient">They read in their language.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl font-light leading-relaxed">
            Privacy-first, zero-setup live captions for diverse classrooms. 
            The teacher speaks. Students follow along on their own devices in over 100 languages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a href="/teach" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-all overflow-hidden">
              <Mic className="w-5 h-5" />
              <span>I'm teaching</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </a>
            <a href="/student" className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl glass-panel hover:bg-white/10 transition-all font-medium text-zinc-100">
              <Globe2 className="w-5 h-5 text-cyan-400" />
              <span>I'm a student</span>
            </a>
          </div>
        </div>
        <div className="flex-1 w-full relative">
          <div className="relative z-10 glass-panel rounded-2xl p-2 aspect-[4/3] flex flex-col shadow-2xl shadow-cyan-900/20 transform rotate-2 hover:rotate-0 transition-all duration-500">
            <img src="/__mockup/images/classlingo-glass-hero.png" alt="Live translation interface" className="w-full h-full object-cover rounded-xl opacity-90" />
            <div className="absolute bottom-6 left-6 right-6 glass-panel rounded-xl p-4 flex flex-col gap-2 border-white/20">
              <div className="text-xs font-['DM_Mono'] text-purple-300">Live Transcript • Spanish</div>
              <div className="text-lg font-medium text-white font-['Space_Grotesk']">Bienvenidos a la clase de hoy. Vamos a explorar la fotosíntesis...</div>
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-['Space_Grotesk'] font-bold mb-4">Zero friction setup</h2>
          <p className="text-zinc-400 font-['DM_Mono'] text-sm">No accounts. No installations. Instant connection.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Teacher starts", desc: "Open /teach, allow microphone, and speak naturally. A passcode keeps the session secure.", icon: Mic },
            { step: "02", title: "Students join", desc: "Scan a QR or go to /student. Each student selects their preferred language from 100+ options.", icon: Languages },
            { step: "03", title: "Live stream", desc: "Speech is instantly transcribed, translated, and streamed directly to student screens.", icon: Volume2 },
          ].map((s, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 text-6xl font-black text-white/[0.03] font-['Space_Grotesk'] group-hover:text-cyan-500/[0.05] transition-colors">{s.step}</div>
              <s.icon className="w-8 h-8 text-cyan-400 mb-6" />
              <h3 className="text-xl font-['Space_Grotesk'] font-bold mb-3">{s.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-['Space_Grotesk'] font-bold">Built for real classrooms</h2>
            <div className="space-y-4">
              {[
                { title: "Document Translation", desc: "Share PDFs, DOCX, or images. Translated per-page with vision OCR.", icon: FileText },
                { title: "Student Helpers", desc: "Text-to-speech, hold-to-read, replay last sentence, and adjustable text size.", icon: Volume2 },
                { title: "Ephemeral & Private", desc: "No recordings stored. Secure teacher passcode. Watermarked screenshots.", icon: Lock },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-['Space_Grotesk'] font-bold text-lg text-zinc-200 mb-1">{f.title}</h4>
                    <p className="text-zinc-400 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-3xl blur-2xl"></div>
            <div className="glass-panel p-8 rounded-3xl border border-white/10 relative z-10 space-y-6">
               <div className="flex items-center justify-between border-b border-white/10 pb-4">
                 <div className="font-['DM_Mono'] text-sm text-cyan-300">Student View</div>
                 <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                   <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                   <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300">
                   "And so, when we look at the cellular level..."
                 </div>
                 <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-lg font-medium text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                   "Y así, cuando miramos a nivel celular..."
                 </div>
                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 opacity-50">
                   "We can observe the mitochondria..."
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-32 px-6 text-center">
        <div className="glass-panel max-w-4xl mx-auto rounded-3xl p-12 lg:p-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent"></div>
          <h2 className="text-4xl lg:text-5xl font-['Space_Grotesk'] font-bold mb-6 relative z-10">Break the language barrier.</h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto relative z-10">Start your first live translated session in seconds. No credit card, no account required.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <a href="/teach" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              Start Teaching
              <ChevronRight className="w-4 h-4" />
            </a>
            <a href="/student" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all">
              Join as Student
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}