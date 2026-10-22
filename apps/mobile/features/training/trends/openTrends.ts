import { router } from "expo-router";
import type { StatisticsParams } from "../statistics/types";

/** The Statistics tab's Hangboard view on one workout and grip, closing the screens above the tabs. */
export function openTrends(workoutId: string, gripId: string): void {
  const params: StatisticsParams = { view: "hangboard", workout: workoutId, grip: gripId };
  router.dismissTo({ pathname: "/(tabs)/trends", params });
}
