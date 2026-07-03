import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.10.6",
    "smudgy-jubilance-action.ngrok-free.dev",
  ],
};

export default nextConfig;