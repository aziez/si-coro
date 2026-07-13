import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    images: {
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
