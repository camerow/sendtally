import React from "react";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { AdminHome } from "../moderation/components/AdminHome";
import { adminLinks, adminLoader, adminMeta } from "../moderation/adminRoute";

export const meta: MetaFunction = () => adminMeta("Admin", "/app/admin");

export const links = adminLinks;

export const loader = adminLoader;

export default function AdminHomeRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <AdminHome apiUrl={apiUrl} />;
}
