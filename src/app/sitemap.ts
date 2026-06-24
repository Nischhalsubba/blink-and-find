import type { MetadataRoute } from "next";
import { absoluteUrl, ROUTES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.path === "/" ? 1 : route.path === "/rules" ? 0.9 : 0.7,
  }));
}
