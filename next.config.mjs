/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { reactCompiler: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nuvcxzpgfjmyhmsuarbo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
