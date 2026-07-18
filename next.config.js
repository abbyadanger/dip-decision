/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configure for GitHub Pages deployment
  basePath: process.env.NODE_ENV === 'production' ? '/dip-decision' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/dip-decision/' : '',
}

module.exports = nextConfig