import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Membership } from "@sendtally/api-client";
import { requireApi } from "./api.server";

type Args = LoaderFunctionArgs | ActionFunctionArgs;

export async function getMembership(args: Args): Promise<Membership> {
  const api = await requireApi(args);
  return (await api.entitlements()).membership;
}

export async function requireMembership(args: Args): Promise<Membership> {
  const membership = await getMembership(args);
  if (!membership.active) throw redirect("/app/membership");
  return membership;
}
