import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site is fully static (no server components needing a runtime, no API
  // routes), so export it to plain HTML/CSS/JS in `out/` for Firebase Hosting.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
