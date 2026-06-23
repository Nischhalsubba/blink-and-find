import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const alt = "Blink & Find colorful social preview showing scattered number tiles";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const tiles = [
  { value: "42", x: 760, y: 132, rotate: -8, color: "#7c3aed" },
  { value: "19", x: 920, y: 116, rotate: 7, color: "#06b6d4" },
  { value: "73", x: 1008, y: 270, rotate: -10, color: "#ec4899" },
  { value: "8", x: 790, y: 338, rotate: 9, color: "#f97316" },
  { value: "55", x: 948, y: 438, rotate: -5, color: "#22c55e" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #fff7fd 0%, #f4edff 32%, #ecfeff 66%, #fff7d6 100%)",
          color: "#182033",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 10% 12%, rgba(236,72,153,0.34), transparent 260px), radial-gradient(circle at 88% 14%, rgba(6,182,212,0.34), transparent 280px), radial-gradient(circle at 18% 84%, rgba(251,191,36,0.34), transparent 260px), radial-gradient(circle at 84% 86%, rgba(34,197,94,0.28), transparent 260px)" }} />

        <div
          style={{
            position: "absolute",
            left: 58,
            top: 54,
            right: 58,
            bottom: 54,
            borderRadius: 42,
            border: "2px solid rgba(255,255,255,0.88)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.66))",
            boxShadow: "0 28px 85px rgba(124,58,237,0.22)",
          }}
        />

        <div style={{ position: "absolute", left: 104, top: 92, display: "flex", flexDirection: "column", gap: 22, width: 610 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ padding: "10px 18px", borderRadius: 999, background: "#7c3aed", color: "white", fontWeight: 800, fontSize: 24 }}>{SITE_NAME}</div>
            <div style={{ padding: "10px 18px", borderRadius: 999, background: "#fff1c7", color: "#5b3a00", fontWeight: 800, fontSize: 24 }}>Free web game</div>
          </div>

          <div style={{ fontSize: 84, lineHeight: 0.95, fontWeight: 900, letterSpacing: -4 }}>
            Memorize the number. Find it faster.
          </div>

          <div style={{ fontSize: 31, lineHeight: 1.32, color: "#475569", fontWeight: 700 }}>
            A colorful number-memory game for solo play, nearby friends, and online matches.
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            <div style={{ borderRadius: 20, padding: "15px 18px", background: "#dff7ff", color: "#083344", fontSize: 24, fontWeight: 900 }}>Solo</div>
            <div style={{ borderRadius: 20, padding: "15px 18px", background: "#ffe4e6", color: "#831843", fontSize: 24, fontWeight: 900 }}>Together</div>
            <div style={{ borderRadius: 20, padding: "15px 18px", background: "#dcfce7", color: "#14532d", fontSize: 24, fontWeight: 900 }}>Online</div>
          </div>
        </div>

        <div style={{ position: "absolute", right: 92, top: 86, width: 400, height: 460 }}>
          {tiles.map((tile) => (
            <div
              key={tile.value}
              style={{
                position: "absolute",
                left: tile.x - 700,
                top: tile.y - 86,
                width: 112,
                height: 112,
                borderRadius: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
                border: `5px solid ${tile.color}`,
                color: "#182033",
                fontSize: 42,
                fontWeight: 900,
                boxShadow: "0 16px 32px rgba(24,32,51,0.14)",
                transform: `rotate(${tile.rotate}deg)`,
              }}
            >
              {tile.value}
            </div>
          ))}
          <div style={{ position: "absolute", left: 92, top: 220, width: 210, height: 210, borderRadius: 999, background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 900, boxShadow: "0 24px 52px rgba(124,58,237,0.35)" }}>
            FIND 42
          </div>
        </div>
      </div>
    ),
    size
  );
}
