import React from "react";
// no router needed in mockup
import { Mic, Languages, Sparkles, Youtube, FileText, Ear, Shield } from "lucide-react";

export function Purple() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 selection:bg-fuchsia-300">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}} />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-fuchsia-600">
              <Languages className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">ClassLingo</span>
          </div>
          <nav className="hidden md:flex gap-4">
            <a href="/teach" className="px-6 py-2.5 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors">
              Teacher Login
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
           <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl mix-blend-overlay"></div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-medium mb-6 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span>Live translation for modern classrooms</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-sm">
              Speak English. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 drop-shadow-none">
                Understood Everywhere.
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              The teacher speaks once. Every student follows along with live translated captions in their own language, right on their phone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="/teach" className="group relative px-8 py-4 rounded-full bg-white text-fuchsia-600 font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                I'm Teaching
              </a>
              <a href="/student" className="group relative px-8 py-4 rounded-full bg-fuchsia-800/40 text-white font-bold text-lg backdrop-blur-md border border-white/20 hover:bg-fuchsia-800/60 transition-all flex items-center justify-center gap-3">
                <Languages className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                I'm a Student
              </a>
            </div>
          </div>
          
          <div className="relative flex justify-center items-center">
            {/* Soft decorative blob behind image */}
            <div className="absolute w-[120%] h-[120%] bg-white/10 rounded-full blur-3xl"></div>
            <img 
              src="/__mockup/images/purple-hero.png" 
              alt="ClassLingo Hero Mascot" 
              className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl animate-[bounce_4s_ease-in-out_infinite]"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white/95 backdrop-blur-xl relative z-20 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">As simple as 1, 2, 3</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">No accounts, no downloads. Just point, click, and learn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-slate-100 rounded-full z-0"></div>

            {[
              { 
                step: "1", 
                title: "Teacher Speaks", 
                desc: "Open /teach on your laptop. Hit the mic button and start your lesson in English.",
                icon: <Mic className="w-8 h-8 text-fuchsia-500" />
              },
              { 
                step: "2", 
                title: "Student Connects", 
                desc: "Students open /student on their phones and select from over 100+ native languages.",
                icon: <Languages className="w-8 h-8 text-purple-500" />
              },
              { 
                step: "3", 
                title: "Live Translation", 
                desc: "Watch as your speech instantly appears as translated, scrolling captions on their screens.",
                icon: <Sparkles className="w-8 h-8 text-pink-500" />
              }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] mb-6 border-4 border-slate-50">
                  {item.icon}
                </div>
                <div className="bg-slate-50 rounded-3xl p-8 w-full h-full border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="text-sm font-bold text-fuchsia-500 tracking-wider uppercase mb-2">Step {item.step}</div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24 px-6 bg-slate-50 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything you need. <br className="hidden sm:block"/> Nothing you don't.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Languages className="w-6 h-6 text-fuchsia-600" />,
                title: "100+ Languages",
                desc: "From Spanish to Swahili, students pick exactly what they need on their own device."
              },
              {
                icon: <Youtube className="w-6 h-6 text-fuchsia-600" />,
                title: "Synced YouTube",
                desc: "Play an educational video and we'll translate the captions live for the whole room."
              },
              {
                icon: <FileText className="w-6 h-6 text-fuchsia-600" />,
                title: "Smart Documents",
                desc: "Share PDFs and slides. Students see per-page translations with full image OCR."
              },
              {
                icon: <Ear className="w-6 h-6 text-fuchsia-600" />,
                title: "Student Helpers",
                desc: "Hold-to-read, text-to-speech, and adjustable font sizes for ultimate accessibility."
              },
              {
                icon: <Mic className="w-6 h-6 text-fuchsia-600" />,
                title: "Teacher Controls",
                desc: "Secure passcode entry and quick mic pause/resume so you're always in control."
              },
              {
                icon: <Shield className="w-6 h-6 text-fuchsia-600" />,
                title: "Privacy First",
                desc: "Ephemeral sessions. Screenshot watermarks. No recordings are ever stored."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-fuchsia-200 transition-colors">
                <div className="w-12 h-12 bg-fuchsia-50 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 relative z-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">Ready to break down language barriers?</h2>
          <p className="text-xl text-white/90 mb-12 font-medium">Start your first translated lesson in seconds.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/teach" className="px-10 py-5 rounded-full bg-white text-fuchsia-600 font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
              <Mic className="w-5 h-5" />
              Start Teaching Now
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6 relative z-20 text-center text-slate-400 font-medium">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Languages className="w-5 h-5" />
          <span className="text-xl font-bold text-white">ClassLingo</span>
        </div>
        <p>© {new Date().getFullYear()} ClassLingo. Privacy-first classroom translation.</p>
      </footer>
    </div>
  );
}
