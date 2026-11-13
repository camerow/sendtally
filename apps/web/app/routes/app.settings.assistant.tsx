import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { cloudflareContext } from "../lib/cloudflare-context";
import { AssistantView } from "../settings/components/AssistantView";

export function loader(args: LoaderFunctionArgs): { url: string } {
  return { url: new URL("/mcp", args.context.get(cloudflareContext).env.API_URL).href };
}

export default function AssistantRoute(): React.ReactElement {
  const { url } = useLoaderData<typeof loader>();
  return <AssistantView url={url} />;
}
