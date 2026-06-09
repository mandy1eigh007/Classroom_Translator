export function WarmMono() {
  const cream = "#f7f1e3";
  const paper = "#fffdf6";
  const ink = "#1a1611";
  const ink2 = "#4a4238";
  const magenta = "#d6006a";
  const rule = "#e6dfcd";

  const Surface = ({ kid }: { kid?: boolean }) => (
    <section style={{ background: kid ? paper : cream, padding: "28px 28px 36px", borderTop: kid ? `1px solid ${rule}` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: magenta, letterSpacing: "0.22em", textTransform: "uppercase", margin: 0 }}>
          {kid ? "Kids · Same surface, bigger type" : "Teacher & Student · Editorial mono"}
        </h2>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2 }}>{kid ? "Room · 7K9P" : "Room · 7K9P · live"}</span>
      </div>

      {!kid && (
        <div style={{ background: paper, border: `1px solid ${rule}`, borderRadius: 4, padding: 24 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: magenta }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink2, letterSpacing: "0.18em", textTransform: "uppercase" }}>Listening · English</span>
            <span style={{ marginLeft: "auto", color: ink2, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, lineHeight: 1.3, color: ink, marginBottom: 18, fontWeight: 400 }}>
            "Today we're learning about photosynthesis — how plants turn sunlight into food."
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: `1px solid ${rule}` }}>
            {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…"], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…"]].map(([lang, txt], i) => (
              <div key={lang} style={{ padding: "14px 16px", borderRight: i === 0 ? `1px solid ${rule}` : "none" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: magenta, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>{lang}</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: ink, lineHeight: 1.45 }}>{txt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!kid && (
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button style={{ background: ink, color: paper, border: "none", padding: "11px 22px", borderRadius: 2, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>New Room</button>
          <button style={{ background: "transparent", color: ink, border: `1px solid ${ink}`, padding: "11px 22px", borderRadius: 2, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Share QR</button>
        </div>
      )}

      {kid && (
        <>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22 }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: ink, color: paper, display: "grid", placeItems: "center", fontSize: 48 }}>👩‍🏫</div>
            <div style={{ flex: 1, background: cream, borderRadius: 4, padding: "18px 20px", border: `1px solid ${rule}`, position: "relative" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 24, color: ink, lineHeight: 1.3 }}>
                ¡Hoy aprenderemos sobre la fotosíntesis!
              </div>
              <div style={{ position: "absolute", left: -11, top: 28, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `12px solid ${rule}` }} />
              <div style={{ position: "absolute", left: -9, top: 29, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderRight: `11px solid ${cream}` }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {["🦊", "🐻", "🐼", "🐸"].map((e) => (
              <div key={e} style={{ aspectRatio: "1", background: cream, border: `1px solid ${rule}`, borderRadius: 4, display: "grid", placeItems: "center", fontSize: 40 }}>{e}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["👂", "Again"], ["🙋", "Help"], ["😊", "Got it"]].map(([e, l], i) => (
              <div key={l} style={{ aspectRatio: "1.4", background: i === 1 ? magenta : (i === 2 ? ink : paper), color: i === 0 ? ink : paper, borderRadius: 4, border: i === 0 ? `1px solid ${ink}` : "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                <span style={{ fontSize: 36 }}>{e}</span>
                <span style={{ fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: cream, minHeight: "100vh", color: ink }}>
      <div style={{ padding: "22px 28px", background: paper, borderBottom: `1px solid ${rule}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "0.01em", color: ink }}>
          Class<span style={{ color: magenta }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink2, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Variant D · Editorial mono · ink on paper, magenta accent only
        </div>
      </div>
      <div style={{ padding: "16px 28px", background: paper, borderBottom: `1px solid ${rule}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink2, textTransform: "uppercase", letterSpacing: "0.18em", marginRight: 8 }}>Palette</span>
        {[[ink, "Ink"], [ink2, "Ink 2"], [magenta, "Magenta"], [cream, "Cream"], [paper, "Paper"]].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 2, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, color: ink }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: ink2 }}>Fonts: Syne · Fraunces · DM Mono (Fraunces on kids too)</span>
      </div>
      <Surface />
      <Surface kid />
      <div style={{ padding: "14px 28px", background: paper, borderTop: `1px solid ${rule}`, fontSize: 12, color: ink2, lineHeight: 1.5 }}>
        <strong style={{ color: ink }}>Spine:</strong> ink-on-paper, square corners, single magenta hit.
        <strong style={{ color: ink, marginLeft: 12 }}>Flex:</strong> Fraunces serif everywhere — feels like a serious bilingual textbook, kids edition included.
      </div>
    </div>
  );
}
