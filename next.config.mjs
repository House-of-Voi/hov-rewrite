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
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
