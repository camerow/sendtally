import { useAuth } from "@clerk/react-router";
import { useClearOnUserChange } from "@sendtally/features/query";

export function ClearQueriesOnSignOut(): null {
  const { isLoaded, userId } = useAuth();
  useClearOnUserChange(isLoaded, userId);
  return null;
}
