import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: "https://debatelab-smoky.vercel.app/about", lastModified: new Date(), changeFrequency: "monthly", priority: 1 }]; }
