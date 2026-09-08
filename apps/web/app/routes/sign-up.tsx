import React from "react";
import type { LoaderFunctionArgs } from "react-router";
import { AuthForm } from "../auth/components/AuthForm";
import { redirectSignedInToApp } from "../auth/session.server";

export function meta(): Array<Record<string, string>> {
  return [{ title: "create your account - sendtally" }];
}

export async function loader(args: LoaderFunctionArgs): Promise<null> {
  return redirectSignedInToApp(args);
}

export default function SignUp(): React.ReactElement {
  return <AuthForm intent="sign-up" />;
}
