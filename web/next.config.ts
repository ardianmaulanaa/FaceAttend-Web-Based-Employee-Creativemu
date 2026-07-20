import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR ?? ".next";

const nextConfig: NextConfig = {
  distDir,
  output: "standalone",

  // Membatasi workspace Next.js ke folder web ini
  outputFileTracingRoot: process.cwd(),

  turbopack: {
    root: process.cwd(),
  },

  allowedDevOrigins: [
    "192.168.10.6",
    "smudgy-jubilance-action.ngrok-free.dev",
  ],
};

export default nextConfig;
