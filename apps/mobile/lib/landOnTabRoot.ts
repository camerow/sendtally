import { router } from "expo-router";

/**
 * Back to the tab the climber was on, with everything opened over it gone. A flow that replaced
 * its way here (the first-run wizard starting a workout) has no tab under it, so it lands on Today.
 */
export function landOnTabRoot(): void {
  if (router.canDismiss()) router.dismissAll();
  else router.replace("/(tabs)/today");
}
