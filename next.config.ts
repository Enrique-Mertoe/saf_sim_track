import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    webpack: (config) => {
        // This is to handle the worker files in PDF.js
        config.resolve.alias['pdfjs-dist'] = require.resolve('pdfjs-dist');
        return config;
    },
};

export default nextConfig;
