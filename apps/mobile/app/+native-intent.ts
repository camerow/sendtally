import { webLinkToRoute } from "../lib/webLink";

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return webLinkToRoute(path);
}
