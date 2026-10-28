import { router } from "expo-router";

/** Training insights over the Log, closing the screens above the tabs. */
export function openTrainingInsights(): void {
  router.dismissTo("/(tabs)/sessions");
  router.push("/training-insights");
}
