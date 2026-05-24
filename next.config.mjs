/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["mapbox-gl", "react-map-gl"],
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  webpack: (config) => {
    // mapbox-gl ships .mjs workers that need this in Next.js
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });
    return config;
  },
};

export default nextConfig;
