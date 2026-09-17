import { useAuth } from "@clerk/clerk-expo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { defaultShouldDehydrateQuery, focusManager, useIsRestoring } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { File, Paths } from "expo-file-system";
import * as Updates from "expo-updates";
import React from "react";
import { AppState } from "react-native";
import {
  QUERY_CACHE_MAX_AGE,
  createQueryClient,
  useClearOnUserChange,
  worthPersisting,
} from "@sendtally/features/query";

export const queryClient = createQueryClient();

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) =>
    setFocused(state === "active")
  );
  return () => subscription.remove();
});

const file = (): File => new File(Paths.cache, "query-cache.json");

const persister = createAsyncStoragePersister({
  storage: {
    getItem: () => {
      const f = file();
      return f.exists ? f.text() : null;
    },
    setItem: (_key, value) => {
      const f = file();
      if (!f.exists) f.create();
      f.write(value);
    },
    removeItem: () => {
      const f = file();
      if (f.exists) f.delete();
    },
  },
});

function ClearOnSignOut(): null {
  const restoring = useIsRestoring();
  const { isLoaded, userId } = useAuth();
  useClearOnUserChange(isLoaded && !restoring, userId);
  return null;
}

/** The log opens on the last data it showed, from disk, while it revalidates behind it. */
export function QueryProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: QUERY_CACHE_MAX_AGE,
        buster: `${Updates.runtimeVersion ?? ""}:${Updates.updateId ?? "embedded"}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) && worthPersisting(query.queryKey),
        },
      }}
    >
      <ClearOnSignOut />
      {children}
    </PersistQueryClientProvider>
  );
}
