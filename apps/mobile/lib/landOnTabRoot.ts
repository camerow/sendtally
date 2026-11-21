import { router } from "expo-router";
import { goBack } from "./goBack";

/**
 * Back to the tab the climber was on, with everything opened over it gone. A screen that cannot
 * dismiss goes back, and one with nothing under it (the first-run wizard started its workout)
 * lands on Today.
 */
export function landOnTabRoot(): void {
  if (router.canDismiss()) router.dismissAll();
  else goBack();
}
