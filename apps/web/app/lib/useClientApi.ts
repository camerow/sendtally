import { useAuth } from "@clerk/react-router";
import React from "react";
import { SendtallyApi, type TokenProvider } from "@sendtally/api-client";

// Clerk hands out a new `getToken` as the session refreshes, and every query keys its fetch on
// the client, so a client rebuilt per getter refetches everything. There is one client per API
// URL and user, so another account starts with a cold cache, and an effect keeps its token
// getter current. Only effects and event handlers send
// requests, so the server render never shares a signed-in getter across requests.
const auth: { getToken: TokenProvider } = { getToken: () => Promise.resolve(null) };
const clients = new Map<string, SendtallyApi>();

export function useClientApi(apiUrl: string): SendtallyApi {
  const { getToken, userId } = useAuth();
  React.useEffect(() => {
    auth.getToken = getToken;
  }, [getToken]);
  const key = `${apiUrl}|${userId ?? ""}`;
  const existing = clients.get(key);
  if (existing !== undefined) return existing;
  const api = new SendtallyApi(apiUrl, () => auth.getToken());
  clients.set(key, api);
  return api;
}
