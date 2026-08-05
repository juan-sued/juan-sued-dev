import type { NextConfig } from "next";
const nextConfig: NextConfig = { images: { formats: ["image/avif", "image/webp"] }, async redirects() { return [{ source: "/cases/H3", destination: "/cases/h3", permanent: true }]; } };
export default nextConfig;
