import { router } from "expo-router";

/** Back to the tab the climber was on, with everything opened over it gone. */
export function landOnTabRoot(): void {
  if (router.canDismiss()) router.dismissAll();
}
