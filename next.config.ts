/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["firebasestorage.googleapis.com"], // ✅ Add Firebase Storage domain
  },
};

module.exports = nextConfig;