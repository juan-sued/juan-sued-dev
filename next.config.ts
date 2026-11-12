import type { NextConfig } from "next";
// output "standalone" gera .next/standalone (servidor Node minimo) usado pela imagem Docker.
const nextConfig: NextConfig = { output: "standalone", images: { formats: ["image/avif", "image/webp"] } };
export default nextConfig;
