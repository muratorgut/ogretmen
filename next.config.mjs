/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    serverExternalPackages: ['@react-pdf/renderer'],
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
};

export default nextConfig;
