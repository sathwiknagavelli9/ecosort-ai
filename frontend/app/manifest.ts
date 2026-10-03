import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EcoSort AI",
    short_name: "EcoSort AI",
    description: "Smart waste classification and responsible recycling guidance.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2eb",
    theme_color: "#0d2d27",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

