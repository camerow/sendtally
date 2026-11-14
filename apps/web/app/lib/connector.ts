import type { LoaderFunctionArgs } from "react-router";
import { cloudflareContext } from "./cloudflare-context";

export function connectorUrl(args: LoaderFunctionArgs): string {
  return new URL("/mcp", args.context.get(cloudflareContext).env.API_URL).href;
}
