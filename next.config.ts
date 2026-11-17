import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    images: {
        // SiKumbang (tapera.go.id) rejects requests from Vercel's image
        // optimizer (INVALID_IMAGE_OPTIMIZE_REQUEST in production), while
        // browsers load the same files fine. Serve the originals directly.
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "sikumbang.tapera.go.id",
                port: "",
                pathname: "/**",
            },

        ],
    },
}

export default nextConfig
