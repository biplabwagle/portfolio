import type { MetadataRoute } from "next";

// Required so this metadata route emits a static file under output: "export".
export const dynamic = "force-static";

// Single-page site — the homepage is the only crawlable URL (the nav links are
// in-page #anchors, not separate pages). Emitted as a static /sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://waglegroup.com",
      lastModified: "2026-06-14",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
