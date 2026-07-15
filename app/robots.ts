import type { MetadataRoute } from "next";
import { SITE_ORIGIN, SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/ec/", disallow: ["/ec/admin/", "/ec/account/", "/ec/login", "/ec/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
