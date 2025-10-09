import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      (warning: any) =>
        typeof warning.message === "string" &&
        warning.message.includes("Critical dependency: the request of a dependency is an expression") &&
        warning.module?.resource?.includes("@supabase/realtime-js"),
    ];
    return config;
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Performance optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression
  compress: true,
  // Production source maps for error tracking
  productionBrowserSourceMaps: true,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
