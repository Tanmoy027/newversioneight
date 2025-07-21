/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['images.pexels.com', 'supabase.co'],
    unoptimized: true 
  },
};

module.exports = nextConfig;
