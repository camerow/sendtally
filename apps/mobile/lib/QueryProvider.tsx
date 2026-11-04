import { useAuth } from "@clerk/clerk-expo";
import { QueryClientProvider, focusManager, onlineManager } from "@tanstack/react-query";
import { Directory, File, Paths } from "expo-file-system";
import * as Network from "expo-network";
import * as Updates from "expo-updates";
import React from "react";
import { AppState } from "react-native";
import {
  ScreenFocusContext,
  createQueryClient,
  persistQueries,
  type QueryFiles,
} from "@sendtally/features/query";
import { useScreenFocused } from "./useScreenFocused";
import { draftOwner, setDraftOwner } from "./userDraftFile";

export const queryClient = createQueryClient();

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active")
  );
  return () => subscription.remove();
});

onlineManager.setEventListener((setOnline) => {
  const online = (state: Network.NetworkState): void => setOnline(state.isConnected === true);
  void Network.getNetworkStateAsync().then(online);
  const subscription = Network.addNetworkStateListener(online);
  return () => subscription.remove();
});

/** Each account keeps its reads in a folder of its own, so another account on this phone never restores them. */
const folder = (): Directory | null => {
  const owner = draftOwner();
  return owner === null ? null : new Directory(Paths.document, `query-cache-${owner}`);
};

const fileFor = (key: string): File | null => {
  const dir = folder();
  return dir === null ? null : new File(dir, encodeURIComponent(key));
};

const queryFiles: QueryFiles = {
  read: async (key) => {
    const f = fileFor(key);
    return f?.exists === true ? f.text() : null;
  },
  write: (key, value) => {
    const dir = folder();
    if (dir === null) return;
    if (!dir.exists) dir.create();
    const f = new File(dir, encodeURIComponent(key));
    if (!f.exists) f.create();
    f.write(value);
  },
  remove: (key) => {
    const f = fileFor(key);
    if (f?.exists === true) f.delete();
  },
};

persistQueries(queryClient, queryFiles, Updates.runtimeVersion ?? "");

const singleFileCache = new File(Paths.document, "query-cache.json");
if (singleFileCache.exists) singleFileCache.delete();

/**
 * Points the cache at the signed-in account before any screen reads it. Signing out, or in as
 * someone else, drops the last account's reads, files included.
 */
function OwnCache(): null {
  const { isLoaded, userId } = useAuth();
  React.useLayoutEffect(() => {
    if (!isLoaded) return;
    const next = userId ?? null;
    if (draftOwner() === next) return;
    if (draftOwner() !== null) queryClient.clear();
    setDraftOwner(next);
  }, [isLoaded, userId]);
  return null;
}

/** Every read opens on the last copy it saved on this phone, while it revalidates behind it. */
export function QueryProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ScreenFocusContext.Provider value={useScreenFocused}>
        <OwnCache />
        {children}
      </ScreenFocusContext.Provider>
    </QueryClientProvider>
  );
}
