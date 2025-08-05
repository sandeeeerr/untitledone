import type { NextConfig } from "next";
import { env } from "./src/lib/env";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: env(),
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
