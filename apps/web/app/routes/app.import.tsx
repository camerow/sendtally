import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { useHydrated } from "../lib/useHydrated";
import { ImportFlow } from "../import/components/ImportFlow";

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ImportRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const hydrated = useHydrated();
  return hydrated ? <ImportFlow api={api} /> : <div />;
}
