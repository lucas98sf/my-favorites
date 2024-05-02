const million = require("million/compiler")

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    },
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "ggzalqnaowvopihbidxf.supabase.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.igdb.com",
        port: "",
      },
    ],
  },
}

const millionConfig = {
  auto: {
    rsc: true,
  },
}

module.exports = million.next(nextConfig, millionConfig)
