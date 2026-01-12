/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        resolveAlias: {
            canvas: false,
        },
    },
};

export default nextConfig;
