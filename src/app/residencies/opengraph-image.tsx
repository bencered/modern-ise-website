import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ISE Residency Positions";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.15) 2px, transparent 0)",
          backgroundSize: "50px 50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
            borderRadius: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            boxShadow: "0 0 80px rgba(34, 197, 94, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                backgroundColor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              ISE
            </div>
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Residency Positions
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.7)",
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            Browse R1, R2, R3 & R4 opportunities with top companies
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "32px",
            }}
          >
            {["R1", "R2", "R3", "R4"].map((type) => (
              <div
                key={type}
                style={{
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  color: "#22c55e",
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                {type}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "18px",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          Immersive Software Engineering
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
