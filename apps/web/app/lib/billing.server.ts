import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { MembershipStatus } from "@sendtally/api-client";
import { hasAccess } from "@sendtally/features/billing";
import { requireApi } from "./api.server";

type Args = LoaderFunctionArgs | ActionFunctionArgs;

export async function getMembership(args: Args): Promise<MembershipStatus> {
  const api = await requireApi(args);
  return (await api.entitlements()).membership;
}

/** A live membership or a trial still running: what every member gate asks. */
export async function canAccess(args: Args): Promise<boolean> {
  const api = await requireApi(args);
  return hasAccess(await api.entitlements());
}

export async function requireAccess(args: Args): Promise<void> {
  if (!(await canAccess(args))) throw redirect("/app/membership");
}
