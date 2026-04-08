import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Monsterats",
    short_name: "Monsterats",
    description: "Fitness challenges with configurable scoring for teams",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f8",
    theme_color: "#8a05be",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
