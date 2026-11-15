import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { requireApi } from "../lib/api.server";
import { useClientApi } from "../lib/useClientApi";
import { useHydrated } from "../lib/useHydrated";
import { importSourceOf } from "@sendtally/features/import";
import { FirstRunImport } from "../first-run/FirstRunImport";
import { fromFirstRun } from "../first-run/firstRunGate";
import firstRunStyles from "../first-run/first-run.css?url";
import { ImportFlow } from "../import/components/ImportFlow";
import trainingStyles from "../training/training.css?url";

// First run's frame, and its steps, drawn as a training description.
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: firstRunStyles },
  { rel: "stylesheet", href: trainingStyles },
];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

export default function ImportRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  const api = useClientApi(apiUrl);
  const hydrated = useHydrated();
  const [params] = useSearchParams();
  const from = importSourceOf(params.get("from"));
  if (!hydrated) return <div />;
  return fromFirstRun(params.toString()) ? (
    <FirstRunImport api={api} from={from} />
  ) : (
    <ImportFlow api={api} />
  );
}
