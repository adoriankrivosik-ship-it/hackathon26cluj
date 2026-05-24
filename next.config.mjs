/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["mapbox-gl", "react-map-gl"],
  serverExternalPackages: ["better-sqlite3"],
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
