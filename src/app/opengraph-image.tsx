import { ImageResponse } from "next/og";
import { siteDescription, siteTitle } from "@/lib/site";

export const alt = `${siteTitle} — a collection of projects and applications`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1a2238 0%, #2a3450 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "120px",
            height: "10px",
            background: "#64b4b4",
            borderRadius: "5px",
            marginBottom: "40px",
          }}
        />
        <div style={{ fontSize: "84px", fontWeight: 700, lineHeight: 1.1 }}>
          {siteTitle}
        </div>
        <div
          style={{
            fontSize: "36px",
            marginTop: "28px",
            color: "#a8c8d8",
            maxWidth: "900px",
            lineHeight: 1.4,
          }}
        >
          {siteDescription}
        </div>
        <div
          style={{
            fontSize: "28px",
            marginTop: "60px",
            color: "#64b4b4",
          }}
        >
          inzite.com
        </div>
      </div>
    ),
    size
  );
}
