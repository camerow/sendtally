import { useAuth } from "@clerk/clerk-expo";

export const INSIGHTS_FEATURE = "long_term_insights";

export function useHasFeature(feature: string): boolean {
  const { isLoaded, has } = useAuth();
  if (!isLoaded || has === undefined) return false;
  return has({ feature });
}
