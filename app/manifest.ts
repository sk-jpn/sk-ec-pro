import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SK EC Pro",
    short_name: "SK EC Pro",
    description: "Formosa Japanが提供する中国EC購入代行・輸入サポートサービス",
    start_url: BASE_PATH,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "ja",
    icons: [
      { src: `${BASE_PATH}/icon.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/apple-icon.png`, sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
