import type { MetadataRoute } from "next";
import { refundGuides } from "@/lib/refund-guides";
import { problemGuides } from "@/lib/problem-guides";

const baseUrl = "https://myresolvecenter.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const guidePages = refundGuides.map((guide) => ({
    url: `${baseUrl}/refunds/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const problemPages = problemGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/refunds`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/guides`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...guidePages,
    ...problemPages,
  ];
}
