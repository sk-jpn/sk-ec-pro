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
      { src: `${BASE_PATH}/brand/sk-ec-pro-logo.png`, sizes: "1536x1024", type: "image/png", purpose: "any" },
    ],
  };
}
