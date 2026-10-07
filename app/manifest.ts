import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyResolveCenter",
    short_name: "ResolveCenter",
    description: "Guided refund help for online subscriptions and purchases.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#0b6b53",
    icons: [
      { src: "/brand/myresolvecenter-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/myresolvecenter-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
