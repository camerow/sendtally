import React from "react";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { AreasPage } from "../moderation/components/AreasPage";
import { adminLinks, adminLoader, adminMeta } from "../moderation/adminRoute";

export const meta: MetaFunction = () => adminMeta("Areas", "/app/admin/areas");

export const links = adminLinks;

export const loader = adminLoader;

export default function AreasPageRoute(): React.ReactElement {
  const { apiUrl } = useLoaderData<typeof loader>();
  return <AreasPage apiUrl={apiUrl} />;
}
