import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// `/stay` and every child route are private-by-link and intentionally excluded.
const pages = ["", "/purchase-agent", "/pricing", "/estimate", "/original-products", "/faq", "/about", "/contact", "/terms", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path, index) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : path === "/estimate" ? 0.9 : 0.7,
  }));
}
