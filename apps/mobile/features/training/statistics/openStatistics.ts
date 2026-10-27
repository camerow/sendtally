import { router } from "expo-router";

/** Statistics over the Log, closing the screens above the tabs. */
export function openStatistics(): void {
  router.dismissTo("/(tabs)/sessions");
  router.push("/statistics");
}
