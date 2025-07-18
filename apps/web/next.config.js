/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import path from "path";
import mdx from "@next/mdx";

const withMDX = mdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import("next").NextConfig} */
const config = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  // i18n: {
  //   locales: ["en"],
  //   defaultLocale: "en",
  // },
  transpilePackages: ["geist"],
  serverExternalPackages: [
    "@statsig/statsig-node-core",
    "@hyperdx/node-opentelemetry",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/sdk-node",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Api-Key, X-CSRF-Token",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add path alias for webpack to resolve ~ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "~": path.resolve("./src"),
    };

    if (isServer) {
      config.ignoreWarnings = [{ module: /opentelemetry/ }];
    } else {
      // Don't resolve 'fs', 'net', 'tls' modules on the client to prevent errors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        perf_hooks: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default withMDX(config);
