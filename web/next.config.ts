import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
