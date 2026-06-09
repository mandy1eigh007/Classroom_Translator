export function Duotone() {
  const indigo = "#1a1147";
  const indigoLite = "#241858";
  const gold = "#ffd166";
  const coral = "#ef476f";
  const teal = "#06d6a0";
  const cream = "#fdfbf4";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: cream, minHeight: "100vh", color: indigo }}>
      {/* Brand bar */}
      <div style={{ padding: "22px 28px", background: indigo, color: cream, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "0.01em" }}>
          Class<span style={{ color: gold }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#b9b3d9", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Direction C · Editorial duotone (full reset)
        </div>
      </div>

      {/* Palette */}
      <div style={{ padding: "16px 28px", background: cream, borderBottom: `1px solid ${indigo}22`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: indigo, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 8 }}>Palette</span>
        {[
          [indigo, "Indigo"],
          [gold, "Gold"],
          [coral, "Coral"],
          [teal, "Teal"],
          [cream, "Cream"],
        ].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, color: indigo }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: indigo, opacity: 0.6 }}>Fonts: Playfair Display · Inter · Fredoka (kids)</span>
      </div>

      {/* Adult side */}
      <section style={{ background: indigo, padding: "28px 28px 36px", color: cream, position: "relative", overflow: "hidden" }}>
        {/* Editorial gold blob */}
        <div style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: "50%", background: gold, opacity: 0.15 }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, position: "relative" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: gold, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Teacher & Student · Editorial dark
          </h2>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#b9b3d9" }}>Room · 7K9P · live</span>
        </div>

        <div style={{ background: indigoLite, border: `1px solid ${gold}33`, borderRadius: 16, padding: 20, position: "relative" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: teal, boxShadow: `0 0 10px ${teal}` }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#b9b3d9", letterSpacing: "0.1em", textTransform: "uppercase" }}>Listening · English</span>
            <span style={{ marginLeft: "auto", color: gold, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
          </div>
          <div style={{ fontFamily: "'Playfair Display', 'Syne', serif", fontSize: 28, lineHeight: 1.25, color: cream, marginBottom: 16, fontWeight: 500, fontStyle: "italic" }}>
            "Today we're learning about photosynthesis — how plants turn sunlight into food."
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…", gold], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…", coral]].map(([lang, txt, c]) => (
              <div key={lang} style={{ background: indigo, border: `1px solid ${c}55`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{lang}</div>
                <div style={{ fontSize: 13, color: "#dad6ef", lineHeight: 1.4 }}>{txt}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button style={{ background: gold, color: indigo, border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>NEW ROOM</button>
          <button style={{ background: "transparent", color: cream, border: `1px solid ${cream}`, padding: "10px 18px", borderRadius: 999, fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>SHARE QR</button>
        </div>
      </section>

      {/* Kid side */}
      <section style={{ background: `linear-gradient(180deg, ${gold}, #ffe7a3)`, padding: "28px 24px 36px", position: "relative", color: indigo }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: indigo, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
            Kids · Same palette, sunshine surface
          </h2>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: indigo }}>
            Class<span style={{ color: coral }}>Lingo</span> <span style={{ fontSize: 11, opacity: 0.65, marginLeft: 6 }}>· kids</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", background: indigo, color: cream, display: "grid", placeItems: "center", fontSize: 48, boxShadow: `0 0 0 4px ${coral}55` }}>👩‍🏫</div>
          <div style={{ flex: 1, background: cream, borderRadius: 22, padding: "16px 18px", position: "relative", boxShadow: `0 6px 0 ${indigo}22` }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 22, color: indigo, lineHeight: 1.3 }}>
              ¡Hoy aprenderemos sobre la fotosíntesis!
            </div>
            <div style={{ position: "absolute", left: -12, top: 28, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `14px solid ${cream}` }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          {["🦊", "🐻", "🐼", "🐸"].map((e) => (
            <div key={e} style={{ aspectRatio: "1", background: cream, borderRadius: 22, display: "grid", placeItems: "center", fontSize: 40, boxShadow: `0 4px 0 ${indigo}20` }}>{e}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[["👂", "Again", teal], ["🙋", "Help", coral], ["😊", "Got it", indigo]].map(([e, l, c]) => (
            <div key={l} style={{ aspectRatio: "1.4", background: c, color: cream, borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: `0 6px 0 ${indigo}40`, fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
              <span style={{ fontSize: 36 }}>{e}</span>
              <span style={{ fontSize: 14 }}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: "14px 28px", background: indigo, color: "#b9b3d9", fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ color: gold }}>Spine:</strong> indigo + gold + coral + teal, same on both sides.
        <strong style={{ color: gold, marginLeft: 12 }}>Flex:</strong> indigo dark for adults · golden hour for kids · Playfair italic gives a "magazine" weight to the teacher transcript.
      </div>
    </div>
  );
}
