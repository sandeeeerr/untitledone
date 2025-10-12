import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  eslint: {
    // Use the flat config
    dirs: ['src'],
    // Suppress the warning about flat config not being detected (known Next.js 15 issue)
    ignoreDuringBuilds: false,
  },
  webpack: (config) => {
    // Suppress Supabase "Critical dependency" warnings (safe to ignore)
    config.ignoreWarnings = [
      (warning: unknown) =>
        typeof warning === 'object' &&
        warning !== null &&
        'message' in warning &&
        typeof warning.message === "string" &&
        warning.message.includes("Critical dependency") &&
        'module' in warning &&
        typeof warning.module === 'object' &&
        warning.module !== null &&
        'resource' in warning.module &&
        typeof warning.module.resource === 'string' &&
        warning.module.resource.includes("@supabase"),
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
