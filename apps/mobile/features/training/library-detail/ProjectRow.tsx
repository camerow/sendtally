import React from "react";
import { projectsOf } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { useApi } from "../../../lib/api";
import { PreviewRow } from "./PreviewRow";

/** The project a climbing workout is for, by name once the climbs have loaded. */
export function ProjectRow({ slug }: { slug: string }): React.ReactElement {
  const climbs = useQuery(queries.climbs(useApi())).state;
  const project =
    climbs.status === "ready" ? projectsOf(climbs.data).find((c) => c.slug === slug) : undefined;
  return <PreviewRow title={t("plan.project")} detail={project?.name ?? slug} />;
}
