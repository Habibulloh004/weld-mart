/** @type {import('next').NextConfig} */
const isLocalBackend = Boolean(
  process.env.NEXT_PUBLIC_BACK_URL &&
    /(localhost|127\.0\.0\.1|::1)/i.test(process.env.NEXT_PUBLIC_BACK_URL)
);

const nextConfig = {
  reactStrictMode: false,
  images: {
    // Avoid Next Image SSRF protection errors when backend is local.
    unoptimized: isLocalBackend,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "weldmart.uz",
      },
      {
        protocol: "https",
        hostname: "www.weldmart.uz",
      },
      {
        protocol: "https",
        hostname: "api.weldmart.uz",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
      },
    ],
  },
};

export default nextConfig;
