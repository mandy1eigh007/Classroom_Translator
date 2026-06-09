export function WarmRetro() {
  const cream = "#f3e9d2";
  const paper = "#fdf6e3";
  const ink = "#2a1a0f";
  const ink2 = "#6b4f3a";
  const red = "#c2362e";
  const mustard = "#e0a82e";
  const teal = "#2b7a78";
  const orange = "#e2733a";

  const Surface = ({ kid }: { kid?: boolean }) => (
    <section style={{ background: kid ? `linear-gradient(180deg, ${paper}, ${cream})` : cream, padding: "28px 28px 36px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Atkinson Hyperlegible', 'Syne', sans-serif", fontWeight: 400, fontSize: 16, color: red, letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>
          {kid ? "Kids · Big & loud" : "Teacher & Student · Schoolbook 1972"}
        </h2>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2 }}>{kid ? "Room · 7K9P" : "Room · 7K9P · live"}</span>
      </div>

      {!kid && (
        <>
          <div style={{ background: paper, borderRadius: 8, padding: 22, border: `3px solid ${ink}`, boxShadow: `6px 6px 0 ${red}` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", paddingBottom: 12, borderBottom: `2px dashed ${ink}33` }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: teal }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink, letterSpacing: "0.14em", textTransform: "uppercase" }}>Listening · English</span>
              <span style={{ marginLeft: "auto", color: red, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
            </div>
            <div style={{ fontFamily: "'Atkinson Hyperlegible', serif", fontSize: 28, lineHeight: 1.25, color: ink, marginBottom: 16, fontWeight: 400 }}>
              "Today we're learning about photosynthesis — how plants turn sunlight into food."
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…", teal], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…", orange]].map(([lang, txt, c]) => (
                <div key={lang} style={{ background: cream, border: `2px solid ${ink}`, borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 12, color: c, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{lang}</div>
                  <div style={{ fontSize: 14, color: ink, lineHeight: 1.45 }}>{txt}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button style={{ background: red, color: paper, border: `2px solid ${ink}`, padding: "11px 22px", borderRadius: 6, fontWeight: 400, fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: `3px 3px 0 ${ink}` }}>New Room</button>
            <button style={{ background: mustard, color: ink, border: `2px solid ${ink}`, padding: "11px 22px", borderRadius: 6, fontWeight: 400, fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: `3px 3px 0 ${ink}` }}>Share QR</button>
          </div>
        </>
      )}

      {kid && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 22 }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: mustard, border: `3px solid ${ink}`, display: "grid", placeItems: "center", fontSize: 48 }}>👩‍🏫</div>
            <div style={{ flex: 1, background: paper, borderRadius: 12, padding: "16px 18px", position: "relative", border: `3px solid ${ink}`, boxShadow: `4px 4px 0 ${teal}` }}>
              <div style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif", fontWeight: 400, fontSize: 24, color: ink, lineHeight: 1.3 }}>
                ¡Hoy aprenderemos sobre la fotosíntesis!
              </div>
              <div style={{ position: "absolute", left: -14, top: 28, width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderRight: `14px solid ${ink}` }} />
              <div style={{ position: "absolute", left: -10, top: 30, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: `12px solid ${paper}` }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            {[["🦊", red], ["🐻", mustard], ["🐼", teal], ["🐸", orange]].map(([e, c]) => (
              <div key={e} style={{ aspectRatio: "1", background: c, border: `3px solid ${ink}`, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 40, boxShadow: `3px 3px 0 ${ink}` }}>{e}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["👂", "Again", teal], ["🙋", "Help", red], ["😊", "Got it", mustard]].map(([e, l, c]) => (
              <div key={l} style={{ aspectRatio: "1.4", background: c, color: c === mustard ? ink : paper, borderRadius: 14, border: `3px solid ${ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: `4px 4px 0 ${ink}`, fontFamily: "'Atkinson Hyperlegible', sans-serif" }}>
                <span style={{ fontSize: 36 }}>{e}</span>
                <span style={{ fontSize: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: cream, minHeight: "100vh", color: ink }}>
      <div style={{ padding: "20px 28px", background: paper, borderBottom: `3px solid ${ink}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif", fontWeight: 400, fontSize: 28, color: ink }}>
          Class<span style={{ color: red }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Variant F · Schoolbook retro · same on both surfaces
        </div>
      </div>
      <div style={{ padding: "16px 28px", background: paper, borderBottom: `1px solid ${ink}30`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink2, textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 8 }}>Palette</span>
        {[[ink, "Ink"], [red, "Red"], [mustard, "Mustard"], [teal, "Teal"], [orange, "Orange"], [cream, "Cream"]].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 4, background: c, border: `1px solid ${ink}` }} />
            <span style={{ fontSize: 11, color: ink }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: ink2 }}>Fonts: Bagel Fat One · DM Mono</span>
      </div>
      <Surface />
      <Surface kid />
      <div style={{ padding: "14px 28px", background: paper, borderTop: `2px solid ${ink}`, fontSize: 12, color: ink2, lineHeight: 1.5 }}>
        <strong style={{ color: ink }}>Spine:</strong> thick black outlines + hard offset shadows, Bagel Fat One headlines on both surfaces.
        <strong style={{ color: ink, marginLeft: 12 }}>Flex:</strong> primary palette stays the same; kids get larger tiles, adults get the same energy in a denser layout.
      </div>
    </div>
  );
}
