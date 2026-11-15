import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { useHydrated } from "../lib/useHydrated";
import { importSourceOf } from "@sendtally/features/import";
import { ImportFlow } from "../import/components/ImportFlow";

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ImportRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const hydrated = useHydrated();
  const [params] = useSearchParams();
  const then = params.get("then") === "/app/start" ? "/app/start" : undefined;
  const from = importSourceOf(params.get("from"));
  return hydrated ? <ImportFlow api={api} then={then} from={from} /> : <div />;
}
