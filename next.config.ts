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
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  }, 
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
