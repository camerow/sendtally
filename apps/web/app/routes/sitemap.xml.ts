import { INDEXABLE_PATHS, SITE_URL } from "../lib/seo";

export function loader(): Response {
  const urls = INDEXABLE_PATHS.map(
    (path) => `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc></url>`
  ).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
