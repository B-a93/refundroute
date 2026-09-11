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
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
