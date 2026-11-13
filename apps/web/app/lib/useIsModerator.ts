import { useRouteLoaderData } from "react-router";
import { queries, useQuery } from "@sendtally/features/query";
import { useClientApi } from "./useClientApi";

/** Convenience only: the API is what refuses everyone else. */
export function useIsModerator(): boolean {
  const apiUrl = useRouteLoaderData<{ apiUrl: string }>("routes/app")?.apiUrl ?? "";
  const api = useClientApi(apiUrl);
  const { state } = useQuery({ ...queries.status(api), enabled: apiUrl !== "" });
  return state.status === "ready" && state.data.role !== "user";
}
