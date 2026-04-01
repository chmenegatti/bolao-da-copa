import type { NextConfig } from "next";

const envAllowedOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: envAllowedOrigins?.length
    ? envAllowedOrigins
    : [
      "bolao.cesarmenegatti.com",
      "*.cesarmenegatti.com",
      "*.trycloudflare.com",
      "localhost",
      "127.0.0.1",
    ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
