import React from "react";
import { Text, View } from "react-native";
import type { ProjectsOverviewVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

function Stat({
  name,
  value,
  last,
}: {
  name: string;
  value: string;
  last: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        width: "50%",
        gap: 3,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRightWidth: last ? 0 : 1,
        borderRightColor: colors.lineOnLightSoft,
      }}
    >
      <Text numberOfLines={1} style={label}>
        {name}
      </Text>
      <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.gunmetal }}>
        {value}
      </Text>
    </View>
  );
}

export function ProjectStats({ overview }: { overview: ProjectsOverviewVM }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: 18,
        marginTop: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <Stat
        name={t("projects.attemptsInvested")}
        value={String(overview.attemptsInvested)}
        last={false}
      />
      <Stat
        name={t("projects.attemptsToSend")}
        value={
          overview.avgAttemptsToSend === null
            ? "-"
            : t("projects.avg", { avg: overview.avgAttemptsToSend })
        }
        last
      />
      <Stat
        name={t("projects.longestRunning")}
        value={overview.longestRunning?.value ?? "-"}
        last={false}
      />
      <Stat name={t("projects.mostSessions")} value={overview.mostSessions?.value ?? "-"} last />
    </View>
  );
}
