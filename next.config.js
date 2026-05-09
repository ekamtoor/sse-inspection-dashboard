/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Photos served from Supabase Storage (current SSE project today; the
  // Hypeify Supabase project once integration lands). The remotePatterns
  // list expands as new buckets / domains come online.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // App is mostly client-side React for the dashboard; the marketing pages
  // and auth shell render server-side. Default Next.js behavior covers both.
};

module.exports = nextConfig;
