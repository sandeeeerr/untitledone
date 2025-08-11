import type { NextConfig } from "next";
import { env } from "./src/lib/env";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: env(),
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
