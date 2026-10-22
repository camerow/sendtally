import React from "react";
import { View } from "react-native";
import { projectStatus, projectsOf } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { Chip } from "../../../components/Chip";
import { useApi } from "../../../lib/api";
import { SheetSection } from "../components/SheetSection";

export type ProjectChoiceProps = { value: string | null; onChange: (slug: string | null) => void };

/** An open project the climbing session is for, if any. Hidden without open projects. */
export function ProjectChoice({ value, onChange }: ProjectChoiceProps): React.ReactElement | null {
  const climbs = useQuery(queries.climbs(useApi())).state;
  const open =
    climbs.status === "ready"
      ? projectsOf(climbs.data).filter((c) => projectStatus(c) === "open" || c.slug === value)
      : [];
  if (open.length === 0) return null;
  return (
    <SheetSection label={t("plan.project")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip
          label={t("plan.noProject")}
          active={value === null}
          uppercase={false}
          onPress={() => onChange(null)}
        />
        {open.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            active={c.slug === value}
            uppercase={false}
            onPress={() => onChange(c.slug)}
          />
        ))}
      </View>
    </SheetSection>
  );
}
