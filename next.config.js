/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  // Ensure that Webpack handles the canvas properly
  webpack: (config) => {
    // Add any necessary webpack configurations here
    return config;
  },
  // Development configuration
  experimental: {
    // Disable experimental features that might cause issues
    turbo: false,
    // Enable more stable features 
    esmExternals: true,
    // Improve module resolution
    modularizeImports: {
      '@material-ui/core/': {
        transform: '@material-ui/core/{{member}}'
      },
      '@material-ui/icons/': {
        transform: '@material-ui/icons/{{member}}'
      }
    }
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase the size limit to 10MB
    }
  }
};

module.exports = nextConfig; 