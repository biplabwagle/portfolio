import type { MetadataRoute } from "next";

// Required so this metadata route emits a static file under output: "export".
export const dynamic = "force-static";

// Emitted as a static /robots.txt at build (output: "export").
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://waglegroup.com/sitemap.xml",
    host: "https://waglegroup.com",
  };
}
