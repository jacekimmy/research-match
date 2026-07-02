// Shared Open Graph image template. Used by the file-convention
// opengraph-image.tsx routes (root, /blog/[slug], /research/[field-slug])
// so every social card shares one branded look.
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function brandOgImage({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  const titleSize = title.length > 70 ? 50 : title.length > 45 ? 58 : 68;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #fdfaf4 0%, #f5eede 100%)",
          padding: 40,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "3px solid #2f3d35",
            borderRadius: 28,
            background: "#fdfaf4",
            padding: "48px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: "linear-gradient(145deg, #659983 0%, #285c46 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fdfaf4",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              R
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#2f3d35" }}>
              Research Match
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#a8843f",
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#26332c",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: "#5c6b62" }}>
                {subtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "2px solid #e5d9bf",
              paddingTop: 26,
            }}
          >
            <div style={{ display: "flex", fontSize: 22, color: "#5c6b62" }}>
              www.researchmatch.site
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 600,
                color: "#fdfaf4",
                background: "linear-gradient(145deg, #659983 0%, #285c46 100%)",
                borderRadius: 999,
                padding: "10px 24px",
              }}
            >
              Find professors in minutes
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
