import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function redirectSignedInToApp(args: LoaderFunctionArgs): Promise<null> {
  const auth = await getAuth(args);
  if (auth.isAuthenticated) throw redirect("/app");
  return null;
}
