import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Permite qualquer domínio
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/comfy/:path*",
  //       destination: "http://localhost:8188/:path*", // Proxy para a API do ComfyUI
  //     },
  //   ];
  // },
};

export default nextConfig;
