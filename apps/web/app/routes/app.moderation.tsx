import { redirect, type LoaderFunctionArgs } from "react-router";
import { moderationRedirect } from "../moderation/adminRoute";

export function loader({ request }: LoaderFunctionArgs): never {
  throw redirect(moderationRedirect(new URL(request.url)));
}
