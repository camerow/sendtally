import { router } from "expo-router";

/** Back on the weekly Plan, with what was just planned lit for a moment. */
export function backToPlan(highlight: string | null): void {
  router.dismissTo({
    pathname: "/(tabs)/train",
    params: { view: "plan", at: String(Date.now()), ...(highlight === null ? {} : { highlight }) },
  });
}
