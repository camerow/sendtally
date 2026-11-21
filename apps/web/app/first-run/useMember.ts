import { useLoaderData } from "react-router";
import type { loader } from "../routes/app.start";

/** Whether the user is a member, as the wizard's route loaded it; checkout revalidates it. */
export function useMember(): boolean {
  return useLoaderData<typeof loader>().member;
}
