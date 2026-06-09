export function WarmLight() {
  const cream = "#faf3e3";
  const paper = "#fffaf0";
  const ink = "#1f1a14";
  const teal = "#0e7c86";
  const magenta = "#c4006a";
  const ochre = "#e3a857";
  const sage = "#6da77a";
  const coral = "#e35d5b";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: cream, minHeight: "100vh", color: ink }}>
      {/* Brand bar */}
      <div style={{ padding: "20px 28px", background: paper, borderBottom: `2px solid ${ink}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "0.01em", color: ink }}>
          Class<span style={{ color: magenta }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#736b5e", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Direction B · Warm light everywhere
        </div>
      </div>

      {/* Palette */}
      <div style={{ padding: "16px 28px", background: paper, borderBottom: `1px solid ${ink}22`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#736b5e", textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 8 }}>Palette</span>
        {[
          [ink, "Ink"],
          [teal, "Teal"],
          [magenta, "Magenta"],
          [ochre, "Ochre"],
          [sage, "Sage"],
          [coral, "Coral"],
          [cream, "Cream"],
        ].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, color: "#444" }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#736b5e" }}>Fonts: Syne · DM Mono · Fraunces (long-form)</span>
      </div>

      {/* Adult side */}
      <section style={{ background: cream, padding: "28px 28px 36px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: teal, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Teacher & Student · Same warm surface
          </h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#736b5e" }}>Room · 7K9P · live</span>
        </div>

        <div style={{ background: paper, border: `1px solid ${ink}22`, borderRadius: 16, padding: 20, boxShadow: "0 2px 0 rgba(31,26,20,0.04)" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: coral, boxShadow: `0 0 8px ${coral}88` }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#736b5e", letterSpacing: "0.1em", textTransform: "uppercase" }}>Listening · English</span>
            <span style={{ marginLeft: "auto", color: magenta, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
          </div>
          <div style={{ fontFamily: "'Fraunces', 'Syne', serif", fontSize: 24, lineHeight: 1.3, color: ink, marginBottom: 16, fontWeight: 500 }}>
            "Today we're learning about photosynthesis — how plants turn sunlight into food."
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…", teal], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…", magenta]].map(([lang, txt, c]) => (
              <div key={lang} style={{ background: cream, border: `1px solid ${c}55`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{lang}</div>
                <div style={{ fontSize: 13, color: ink, lineHeight: 1.4 }}>{txt}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button style={{ background: ink, color: cream, border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>NEW ROOM</button>
          <button style={{ background: "transparent", color: magenta, border: `1px solid ${magenta}`, padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>SHARE QR</button>
        </div>
      </section>

      {/* Kid side */}
      <section style={{ background: `linear-gradient(180deg, ${paper}, #f5e9c8)`, padding: "28px 24px 36px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: magenta, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Kids · Same surface, bigger type
          </h2>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: ink }}>
            Class<span style={{ color: magenta }}>Lingo</span> <span style={{ fontSize: 11, color: "#736b5e", marginLeft: 6 }}>· kids</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", background: `radial-gradient(circle at 30% 30%, #fff, ${ochre})`, display: "grid", placeItems: "center", fontSize: 48, boxShadow: `0 0 0 4px ${teal}33` }}>👩‍🏫</div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 22, padding: "16px 18px", position: "relative", boxShadow: `0 6px 0 ${ink}10` }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 22, color: ink, lineHeight: 1.3 }}>
              ¡Hoy aprenderemos sobre la fotosíntesis!
            </div>
            <div style={{ position: "absolute", left: -12, top: 28, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: "14px solid #fff" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          {["🦊", "🐻", "🐼", "🐸"].map((e) => (
            <div key={e} style={{ aspectRatio: "1", background: "#fff", borderRadius: 22, display: "grid", placeItems: "center", fontSize: 40, boxShadow: `0 4px 0 ${ink}15` }}>{e}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[["👂", "Again", teal], ["🙋", "Help", coral], ["😊", "Got it", sage]].map(([e, l, c]) => (
            <div key={l} style={{ aspectRatio: "1.4", background: c, color: "#fff", borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: `0 6px 0 ${ink}25`, fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
              <span style={{ fontSize: 36 }}>{e}</span>
              <span style={{ fontSize: 14 }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: "14px 28px", background: paper, borderTop: `1px solid ${ink}22`, fontSize: 12, color: "#736b5e", lineHeight: 1.5 }}>
        <strong style={{ color: ink }}>Spine:</strong> warm cream, ink-on-paper, teal + magenta accents.
        <strong style={{ color: ink, marginLeft: 12 }}>Flex:</strong> Fraunces serif on adult feed for readability · Fredoka swap on kid type, same colors.
      </div>
    </div>
  );
}
