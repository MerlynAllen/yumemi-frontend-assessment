import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    reactStrictMode: true,
    allowedDevOrigins: [
        "yumemi-frontend-engineer-codecheck-api.vercel.app",
        'local-origin.dev',
        '*.local-origin.dev'
    ]
};

export default nextConfig;
