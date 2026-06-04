import { ImageResponse } from "next/og";

export const alt = "Vitorra Holdings Limited — innovative products and dependable solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#141414",
          backgroundImage:
            "radial-gradient(circle at 82% 12%, rgba(197,178,122,0.24), transparent 55%), radial-gradient(circle at 8% 92%, rgba(197,178,122,0.10), transparent 50%)",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "9999px", backgroundColor: "#C5B27A" }} />
          <div style={{ fontSize: "24px", letterSpacing: "8px", color: "#C5B27A", fontWeight: 700 }}>
            VITORRA HOLDINGS LIMITED
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "78px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.04, letterSpacing: "-2px" }}>
            Innovative products.
          </div>
          <div style={{ fontSize: "78px", fontWeight: 700, color: "#C5B27A", lineHeight: 1.04, letterSpacing: "-2px" }}>
            Dependable solutions.
          </div>
        </div>

        {/* Sectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "27px", color: "rgba(255,255,255,0.55)" }}>
          <span>Fuel Technology</span>
          <span style={{ color: "#C5B27A" }}>·</span>
          <span>Healthcare</span>
          <span style={{ color: "#C5B27A" }}>·</span>
          <span>Coffee</span>
          <span style={{ color: "#C5B27A" }}>·</span>
          <span>Logistics</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
