import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { MembershipStatus } from "@sendtally/api-client";
import { requireApi } from "./api.server";

type Args = LoaderFunctionArgs | ActionFunctionArgs;

export async function getMembership(args: Args): Promise<MembershipStatus> {
  const api = await requireApi(args);
  return (await api.entitlements()).membership;
}
