import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

/** A project is a climb now, and its page is the climb's page, which takes the slug too. */
export function loader({ params }: LoaderFunctionArgs): Response {
  return redirect(`/app/log/climbs/${encodeURIComponent(params["slug"] ?? "")}`, 301);
}
