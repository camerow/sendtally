import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { SendtallyApi, type TokenProvider } from "@sendtally/api-client";
import { invalidateAfterWrite } from "@sendtally/features/query";
import { API_URL } from "./config";
import { queryClient } from "./QueryProvider";

// Clerk hands out a new `getToken` on some renders, and every screen keys its
// fetch effects on the client, so there is one client and an effect keeps its
// token getter current. Requests read the getter when they fire, which is
// always after that effect has run.
const auth: { getToken: TokenProvider } = { getToken: () => Promise.resolve(null) };

const api = new SendtallyApi(
  API_URL,
  () => auth.getToken(),
  (write) => void invalidateAfterWrite(queryClient, write)
);

export function useApi(): SendtallyApi {
  const { getToken } = useAuth();
  React.useEffect(() => {
    auth.getToken = getToken;
  }, [getToken]);
  return api;
}
