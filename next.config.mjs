/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const openclawUrl = process.env.OPENCLAW_AGENT_URL;
    if (!openclawUrl) return [];
    return [
      {
        source: "/v1/clawg-ui",
        destination: openclawUrl,
      },
    ];
  },
};

export default nextConfig;
