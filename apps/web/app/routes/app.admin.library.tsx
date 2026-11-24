import React from "react";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { LibraryPage } from "../moderation/components/LibraryPage";
import { adminLinks, adminLoader, adminMeta } from "../moderation/adminRoute";

export const meta: MetaFunction = () => adminMeta("Library", "/app/admin/library");

export const links = adminLinks;

export const loader = adminLoader;

export default function LibraryPageRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <LibraryPage apiUrl={apiUrl} />;
}
