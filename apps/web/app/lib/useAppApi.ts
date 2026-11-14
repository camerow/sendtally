import { useRouteLoaderData } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { useClientApi } from "./useClientApi";

/** The API client for any page under `/app`, from the app layout's loader. */
export function useAppApi(): SendtallyApi {
  const data = useRouteLoaderData<{ apiUrl: string }>("routes/app");
  return useClientApi(data?.apiUrl ?? "");
}
