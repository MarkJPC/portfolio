import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://bydkvohinmmjiuvwnswa.supabase.co')],
  },
};

module.exports = {
  images: {
    remotePatterns: [new URL('https://bydkvohinmmjiuvwnswa.supabase.co')],
  },
}

export default nextConfig;
