import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070B",
          color: "#F5F7FA",
          fontSize: 88,
          fontWeight: 800
        }}
      >
        UFO Puff
      </div>
    ),
    size,
  );
}
