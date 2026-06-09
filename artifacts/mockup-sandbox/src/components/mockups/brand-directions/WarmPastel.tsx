export function WarmPastel() {
  const sand = "#f4ead5";
  const paper = "#fffaf0";
  const ink = "#2b2a3a";
  const ink2 = "#6e6a82";
  const blush = "#e8a0a8";
  const sage = "#a8c4a2";
  const lilac = "#bba3d9";
  const sky = "#9dc4d3";

  const Surface = ({ kid }: { kid?: boolean }) => (
    <section style={{ background: kid ? `linear-gradient(180deg, ${paper}, ${sand})` : sand, padding: "28px 28px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 13, color: lilac, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
          {kid ? "Kids · Same pastels, bigger tiles" : "Teacher & Student · Soft pastel"}
        </h2>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2 }}>{kid ? "Room · 7K9P" : "Room · 7K9P · live"}</span>
      </div>

      {!kid && (
        <>
          <div style={{ background: paper, borderRadius: 24, padding: 24, boxShadow: `0 4px 0 ${ink}10`, border: `1px solid ${ink}10` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: sage, boxShadow: `0 0 8px ${sage}` }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2, letterSpacing: "0.12em", textTransform: "uppercase" }}>Listening · English</span>
              <span style={{ marginLeft: "auto", color: blush, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>3 students · 0 confused</span>
            </div>
            <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1.3, color: ink, marginBottom: 16 }}>
              "Today we're learning about photosynthesis — how plants turn sunlight into food."
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Spanish", "Hoy aprenderemos sobre la fotosíntesis…", sky], ["Vietnamese", "Hôm nay chúng ta sẽ học về quang hợp…", blush]].map(([lang, txt, c]) => (
                <div key={lang} style={{ background: `${c}33`, border: `1px solid ${c}77`, borderRadius: 16, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4, opacity: 0.7 }}>{lang}</div>
                  <div style={{ fontSize: 14, color: ink, lineHeight: 1.4 }}>{txt}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button style={{ background: lilac, color: "#fff", border: "none", padding: "12px 22px", borderRadius: 999, fontWeight: 700, fontFamily: "'Quicksand', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>NEW ROOM</button>
            <button style={{ background: paper, color: ink, border: `1px solid ${ink}22`, padding: "12px 22px", borderRadius: 999, fontWeight: 700, fontFamily: "'Quicksand', sans-serif", fontSize: 13, letterSpacing: "0.05em" }}>SHARE QR</button>
          </div>
        </>
      )}

      {kid && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: `radial-gradient(circle at 30% 30%, ${paper}, ${blush})`, display: "grid", placeItems: "center", fontSize: 48, boxShadow: `0 0 0 4px ${sky}66` }}>👩‍🏫</div>
            <div style={{ flex: 1, background: paper, borderRadius: 22, padding: "16px 18px", position: "relative", boxShadow: `0 6px 0 ${ink}10` }}>
              <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 22, color: ink, lineHeight: 1.3 }}>
                ¡Hoy aprenderemos sobre la fotosíntesis!
              </div>
              <div style={{ position: "absolute", left: -12, top: 28, width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderRight: `14px solid ${paper}` }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            {[["🦊", blush], ["🐻", sage], ["🐼", lilac], ["🐸", sky]].map(([e, c]) => (
              <div key={e} style={{ aspectRatio: "1", background: `${c}33`, border: `1px solid ${c}99`, borderRadius: 24, display: "grid", placeItems: "center", fontSize: 40 }}>{e}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["👂", "Again", sky], ["🙋", "Help", blush], ["😊", "Got it", sage]].map(([e, l, c]) => (
              <div key={l} style={{ aspectRatio: "1.4", background: c, color: ink, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: `0 6px 0 ${ink}25`, fontFamily: "'Quicksand', sans-serif", fontWeight: 700 }}>
                <span style={{ fontSize: 36 }}>{e}</span>
                <span style={{ fontSize: 14 }}>{l}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );

  return (
    <div style={{ fontFamily: "'Quicksand', sans-serif", background: sand, minHeight: "100vh", color: ink }}>
      <div style={{ padding: "20px 28px", background: paper, borderBottom: `1px solid ${ink}15`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Quicksand', sans-serif", fontWeight: 700, fontSize: 26, color: ink }}>
          Class<span style={{ color: lilac }}>Lingo</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: ink2, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Variant E · Soft pastel · same on both surfaces
        </div>
      </div>
      <div style={{ padding: "16px 28px", background: paper, borderBottom: `1px solid ${ink}15`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: ink2, textTransform: "uppercase", letterSpacing: "0.15em", marginRight: 8 }}>Palette</span>
        {[[ink, "Ink"], [lilac, "Lilac"], [blush, "Blush"], [sage, "Sage"], [sky, "Sky"], [sand, "Sand"]].map(([c, n]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 8, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }} />
            <span style={{ fontSize: 11, color: ink }}>{n}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: ink2 }}>Fonts: Quicksand · DM Mono</span>
      </div>
      <Surface />
      <Surface kid />
      <div style={{ padding: "14px 28px", background: paper, borderTop: `1px solid ${ink}15`, fontSize: 12, color: ink2, lineHeight: 1.5 }}>
        <strong style={{ color: ink }}>Spine:</strong> sand surface, rounded everything, Quicksand on both adult + kid.
        <strong style={{ color: ink, marginLeft: 12 }}>Flex:</strong> tile size + type size scale up for kids, same colors throughout.
      </div>
    </div>
  );
}
