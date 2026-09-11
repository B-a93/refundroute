import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth", "/cases/", "/dashboard", "/new-case"],
    },
    sitemap: "https://myresolvecenter.com/sitemap.xml",
    host: "https://myresolvecenter.com",
  };
}
