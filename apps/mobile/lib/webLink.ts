const ROUTES: [RegExp, string][] = [
  [/^\/sessions\/(.+)$/, "/session/$1"],
  [/^\/projects\/(.+)$/, "/project/$1"],
  [/^\/trends\/(.+)$/, "/trend/$1"],
  [/^\/settings\/gyms\/(.+)$/, "/gym/$1"],
  [/^\/(projects|trends|settings)$/, "/(tabs)/$1"],
  [/^\/(journal\/.+|account|membership)$/, "/$1"],
];

/** Maps a sendtally.com/app link onto its mobile route; anything else passes through untouched. */
export function webLinkToRoute(link: string): string {
  const path = link.replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "");
  const match = /^\/app(\/.*)?$/.exec(path);
  if (link.startsWith("sendtally:") || match === null) return link;
  const rest = (match[1] ?? "").replace(/\/$/, "");
  for (const [pattern, route] of ROUTES)
    if (pattern.test(rest)) return rest.replace(pattern, route);
  return "/";
}
