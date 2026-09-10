import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { AuthForm } from "../auth/components/AuthForm";
import { redirectSignedInToApp } from "../auth/session.server";
import { pageMeta } from "../lib/seo";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: "sign in - sendtally", path: "/sign-in", noindex: true });
}

export async function loader(args: LoaderFunctionArgs): Promise<null> {
  return redirectSignedInToApp(args);
}

export default function SignIn(): React.ReactElement {
  return <AuthForm intent="sign-in" />;
}
