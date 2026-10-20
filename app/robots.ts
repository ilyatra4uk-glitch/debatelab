import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/about", "/login", "/register"], disallow: ["/", "/debate-bot", "/practice", "/practices", "/compete", "/friends", "/profile", "/videos", "/api/"] }, sitemap: "https://debatelab-smoky.vercel.app/sitemap.xml" }; }
