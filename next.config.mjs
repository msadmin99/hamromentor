/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      { protocol: "https", hostname: "api.drgutka.com", pathname: "/media/**" },
      { protocol: "https", hostname: "*.run.app", pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
