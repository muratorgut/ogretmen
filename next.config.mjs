/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                canvas: false,
                fs: false,
            };
        }
        config.resolve.alias.canvas = false;
        return config;
    },
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
    },
};

export default nextConfig;
