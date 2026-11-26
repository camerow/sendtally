import React from "react";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { LibraryCreatePage } from "../moderation/components/LibraryCreatePage";
import { adminLinks, adminLoader, adminMeta } from "../moderation/adminRoute";

export const meta: MetaFunction = ({ location }) =>
  adminMeta(
    new URLSearchParams(location.search).get("type") === "workout" ? "New workout" : "New exercise",
    "/app/admin/library/new"
  );

export const links = adminLinks;

export const loader = adminLoader;

export default function LibraryCreatePageRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <LibraryCreatePage apiUrl={apiUrl} />;
}
