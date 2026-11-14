import { redirect } from "react-router";

/** Trends and its Days and Endurance pages became Stats. */
export function loader(): never {
  throw redirect("/app/stats", 301);
}
