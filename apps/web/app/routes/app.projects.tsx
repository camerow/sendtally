import { redirect } from "react-router";

/** Projects is a filter on the Log page now. */
export function loader(): Response {
  return redirect("/app?status=projects", 301);
}
