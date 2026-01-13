/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                canvas: false,
                fs: false,
                path: false,
                crypto: false,
            };
        }
        config.resolve.alias.canvas = false;
        return config;
    },
    output: 'standalone',
};

module.exports = nextConfig;
