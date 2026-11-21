import { router, type Href } from "expo-router";

/** Back to the screen under this one, or `fallback` when a flow replaced its way here and left none. */
export function goBack(fallback: Href = "/(tabs)/today"): void {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
