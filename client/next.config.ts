import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    // In development, rewrites to local server
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          {
            source: "/socket.io/:path*",
            destination: "http://localhost:5000/socket.io/:path*"
          }
        ]
      };
    }
    // In production on Vercel, socket.io runs on same origin
    return [];
  }
};

export default nextConfig;
