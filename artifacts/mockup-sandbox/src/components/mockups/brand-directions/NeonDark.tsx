export function NeonDark() {
  const ink = "#050617";
  const cyan = "#00f0ff";
  const magenta = "#ff00ff";
  const green = "#7bff8a";
  const cream = "#fef6e4";
  const warmInk = "#1a1a2e";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#e8e8ec", minHeight: "100vh" }}>
      {/* Brand bar */}
      <div style={{ padding: "20px 28px", background: ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "0.01em" }}>
          Class<span style={{ color: magenta }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9aa0b4", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Direction A · Dark for adults, warm for kids
        </div>
      </div>

      {/* Palette */}
      <div style={{ padding: "16px 28px", background: "#fff", borderBottom: "1px solid #e2e3ea", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6b6f80", textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 8 }}>Palette</span>
        {[
          ["#050617", "Ink"],
          [cyan, "Cyan"],
          [magenta, "Magenta"],
          [green, "Green"],
          ["#ff5470", "Red"],
          [cream, "Cream"],
        ].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, color: "#444" }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b6f80" }}>Fonts: Syne · DM Mono · Fredoka (kids)</span>
      </div>

      {/* Adult side */}
      <section style={{ background: ink, padding: "28px 28px 36px", color: "#e6e8f0", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: cyan, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Teacher & Student · Dark surface
          </h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#7c8294" }}>Room · 7K9P · live</span>
        </div>

        {/* Mock teacher feed */}
        <div style={{ background: "#0c0f24", border: "1px solid #1c2140", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cyan, boxShadow: `0 0 12px ${cyan}` }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9aa0b4", letterSpacing: "0.1em", textTransform: "uppercase" }}>Listening · English</span>
            <span style={{ marginLeft: "auto", color: magenta, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, lineHeight: 1.3, color: "#fff", marginBottom: 16 }}>
            "Today we're learning about photosynthesis — how plants turn sunlight into food."
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…", cyan], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…", magenta]].map(([lang, txt, c]) => (
              <div key={lang} style={{ background: "#11142d", border: `1px solid ${c}33`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{lang}</div>
                <div style={{ fontSize: 13, color: "#d4d7e6", lineHeight: 1.4 }}>{txt}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button style={{ background: cyan, color: ink, border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>NEW ROOM</button>
          <button style={{ background: "transparent", color: magenta, border: `1px solid ${magenta}`, padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>SHARE QR</button>
        </div>
      </section>

      {/* Kid side */}
      <section style={{ background: `linear-gradient(180deg, #ffd8c2, ${cream})`, padding: "28px 24px 36px", color: warmInk, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: "#c4006a", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Kids · Warm surface (same logo, same accents)
          </h2>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>
            Class<span style={{ color: magenta }}>Lingo</span> <span style={{ fontSize: 11, color: "#7a6f5e", marginLeft: 6 }}>· kids</span>
          </span>
        </div>

        {/* Teacher bubble preview */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #fff, #ffd966)", display: "grid", placeItems: "center", fontSize: 48, boxShadow: `0 0 0 4px ${cyan}55` }}>👩‍🏫</div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 22, padding: "16px 18px", position: "relative", boxShadow: "0 6px 0 rgba(0,0,0,0.06)" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 22, color: warmInk, lineHeight: 1.3 }}>
              ¡Hoy aprenderemos sobre la fotosíntesis!
            </div>
            <div style={{ position: "absolute", left: -12, top: 28, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: "14px solid #fff" }} />
          </div>
        </div>

        {/* Tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          {["🦊", "🐻", "🐼", "🐸"].map((e) => (
            <div key={e} style={{ aspectRatio: "1", background: "#fff", borderRadius: 22, display: "grid", placeItems: "center", fontSize: 40, boxShadow: "0 4px 0 rgba(0,0,0,0.08)" }}>{e}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[["👂", "Again", cyan], ["🙋", "Help", "#ff5470"], ["😊", "Got it", green]].map(([e, l, c]) => (
            <div key={l} style={{ aspectRatio: "1.4", background: c, color: c === green ? warmInk : "#fff", borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: "0 6px 0 rgba(0,0,0,0.15)", fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
              <span style={{ fontSize: 36 }}>{e}</span>
              <span style={{ fontSize: 14 }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: "14px 28px", background: "#fff", borderTop: "1px solid #e2e3ea", fontSize: 12, color: "#6b6f80", lineHeight: 1.5 }}>
        <strong style={{ color: ink }}>Spine:</strong> same wordmark, same 4 accent colors, Syne for headings.
        <strong style={{ color: ink, marginLeft: 12 }}>Flex:</strong> dark + DM Mono for adult precision · warm cream + Fredoka for kid friendliness.
      </div>
    </div>
  );
}
