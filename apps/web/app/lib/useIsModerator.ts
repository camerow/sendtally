import { useRouteLoaderData } from "react-router";
import { queries, useQuery } from "@sendtally/features/query";
import { useClientApi } from "./useClientApi";

/** Whether the viewer moderates; null until their status loads. Convenience only: the API is what refuses everyone else. */
export function useModerator(): boolean | null {
  const apiUrl = useRouteLoaderData<{ apiUrl: string }>("routes/app")?.apiUrl ?? "";
  const api = useClientApi(apiUrl);
  const { state } = useQuery({ ...queries.status(api), enabled: apiUrl !== "" });
  return state.status === "ready" ? state.data.role !== "user" : null;
}

export const useIsModerator = (): boolean => useModerator() === true;
