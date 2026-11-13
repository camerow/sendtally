import { redirect } from "react-router";

/** The journal reads in the Log page. */
export function loader(): Response {
  return redirect("/app", 301);
}
