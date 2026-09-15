import { getAuth } from "@clerk/react-router/server";
import { data, redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { ApiError, SendtallyApi } from "@sendtally/api-client";
import { cloudflareContext } from "./cloudflare-context";

type Args = LoaderFunctionArgs | ActionFunctionArgs;

export async function requireApi(args: Args): Promise<SendtallyApi> {
  const { env } = args.context.get(cloudflareContext);
  const auth = await getAuth(args);
  if (!auth.isAuthenticated || auth.tokenType !== "session_token") throw redirect("/sign-in");
  return new SendtallyApi(env.API_URL, () => auth.getToken());
}

/** A missing row becomes a 404 Response, which survives production error sanitising and reaches the ErrorBoundary as one. */
export async function orNotFound<T>(pending: Promise<T>): Promise<T> {
  try {
    return await pending;
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) throw data(null, { status: 404 });
    throw error;
  }
}
