import { useAuth } from "@clerk/react-router";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { SendtallyApi, type ApiWrite, type TokenProvider } from "@sendtally/api-client";
import { invalidateAfterWrite } from "@sendtally/features/query";

// Clerk hands out a new `getToken` as the session refreshes, so there is one client per API URL
// and user, and an effect keeps its token getter and cache hook current. Only effects and event
// handlers send requests, so the server render never shares a signed-in getter across requests.
const bound: { getToken: TokenProvider; onWrite: (write: ApiWrite) => void } = {
  getToken: () => Promise.resolve(null),
  onWrite: () => undefined,
};
const clients = new Map<string, SendtallyApi>();

export function useClientApi(apiUrl: string): SendtallyApi {
  const { getToken, userId } = useAuth();
  const client = useQueryClient();
  React.useEffect(() => {
    bound.getToken = getToken;
    bound.onWrite = (write) => void invalidateAfterWrite(client, write);
  }, [getToken, client]);
  const key = `${apiUrl}|${userId ?? ""}`;
  const existing = clients.get(key);
  if (existing !== undefined) return existing;
  const api = new SendtallyApi(
    apiUrl,
    () => bound.getToken(),
    (write) => bound.onWrite(write)
  );
  clients.set(key, api);
  return api;
}
