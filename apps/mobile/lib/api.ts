import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { SendtallyApi, type ApiWrite, type TokenProvider } from "@sendtally/api-client";
import { invalidateAfterWrite } from "@sendtally/features/query";
import { API_URL } from "./config";

// Clerk hands out a new `getToken` on some renders, so there is one client and
// an effect keeps its token getter and cache hook current. Requests read them
// when they fire, which is always after that effect has run.
const bound: { getToken: TokenProvider; onWrite: (write: ApiWrite) => void } = {
  getToken: () => Promise.resolve(null),
  onWrite: () => undefined,
};

const api = new SendtallyApi(
  API_URL,
  () => bound.getToken(),
  (write) => bound.onWrite(write)
);

export function useApi(): SendtallyApi {
  const { getToken } = useAuth();
  const client = useQueryClient();
  React.useEffect(() => {
    bound.getToken = getToken;
    bound.onWrite = (write) => void invalidateAfterWrite(client, write);
  }, [getToken, client]);
  return api;
}
