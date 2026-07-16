import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/ec",
  experimental: {
    serverActions: {
      bodySizeLimit: "22mb",
    },
  },
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/admin/estimates/*/pdf": ["./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff", "./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff"],
    "/account/estimates/*/pdf": ["./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff", "./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff"],
  },
};

export default nextConfig;
