import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: ["@storybook/addon-onboarding", "@chromatic-com/storybook", {
    name: "@storybook/addon-styling",
    options: {
      postCss: true,
    },
  }, "@storybook/addon-docs"],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  staticDirs: ["../public"]
};
export default config;
