/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' }
    ]
  },
  experimental: {
    // Lets the dev server work behind the Emergent ingress
    serverActions: { allowedOrigins: ['*'] }
  }
};

module.exports = nextConfig;
