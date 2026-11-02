import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { Alert } from "react-native";
import { SendtallyApi, type TokenProvider } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import { queryOutbox } from "@sendtally/features/outbox";
import { invalidateAfterWrite } from "@sendtally/features/query";
import { API_URL } from "./config";
import { queryClient } from "./QueryProvider";
import { onDraftOwnerChange, userDraftFile } from "./userDraftFile";

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

/** Every write the app makes, kept in the signed-in account's own file until the server has it. */
export const outbox = queryOutbox(userDraftFile("outbox"), api, queryClient, () =>
  Alert.alert(t("common.changeRefused"))
);
onDraftOwnerChange(() => void outbox.drain());

export function useApi(): SendtallyApi {
  const { getToken } = useAuth();
  React.useEffect(() => {
    auth.getToken = getToken;
    void outbox.drain();
  }, [getToken]);
  return api;
}
