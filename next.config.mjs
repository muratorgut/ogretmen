/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        resolveAlias: {
            canvas: false,
        },
    },
    serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
