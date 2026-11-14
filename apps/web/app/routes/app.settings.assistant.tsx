import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { connectorUrl } from "../lib/connector";
import { AssistantView } from "../settings/components/AssistantView";

export function loader(args: LoaderFunctionArgs): { url: string } {
  return { url: connectorUrl(args) };
}

export default function AssistantRoute(): React.ReactElement {
  const { url } = useLoaderData<typeof loader>();
  return <AssistantView url={url} />;
}
