import { ClerkProvider } from "@clerk/react-router";
import { deDE, esES, frFR } from "@clerk/localizations";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Outlet, useRouteLoaderData } from "react-router";
import { createQueryClient } from "@sendtally/features/query";
import { ClearQueriesOnSignOut } from "../auth/components/ClearQueriesOnSignOut";
import { Identify } from "../auth/components/Identify";
import type { loader as rootLoader } from "../root";

const CLERK_LOCALIZATIONS = { en: undefined, de: deDE, fr: frFR, es: esES } as const;

export default function ClerkLayout(): React.ReactElement {
  const loaderData = useRouteLoaderData<typeof rootLoader>("root");
  const [queryClient] = React.useState(createQueryClient);
  if (!loaderData) throw new Error("root loader data missing");
  return (
    <ClerkProvider loaderData={loaderData} localization={CLERK_LOCALIZATIONS[loaderData.locale]}>
      <QueryClientProvider client={queryClient}>
        <Identify />
        <ClearQueriesOnSignOut />
        <Outlet />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
