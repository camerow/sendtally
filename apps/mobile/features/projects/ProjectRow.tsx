import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  climbGradeLabel,
  dateLabel,
  disciplineLabel,
  projectMetaLabel,
  projectStatus,
  type ProjectListItem,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { pressRow } from "../../lib/press";

export type ProjectRowProps = { item: ProjectListItem };

function metaLabel({ climb }: ProjectListItem): string {
  if (climb.sessions === 0) {
    return t("projects.addedOn", {
      discipline: disciplineLabel(climb),
      date: dateLabel(climb.first_at),
    });
  }
  const when =
    projectStatus(climb) === "sent"
      ? t("projects.sentOn", { date: dateLabel(climb.last_at) })
      : t("projects.lastOn", { date: dateLabel(climb.last_at) });
  return t("projects.rowMeta", { meta: projectMetaLabel(climb), when });
}

export function ProjectRow({ item }: ProjectRowProps): React.ReactElement {
  const { climb } = item;
  const sent = projectStatus(climb) === "sent";
  return (
    <Pressable
      onPress={() => router.push(`/project/${climb.slug}`)}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Text
        style={{
          width: 56,
          fontFamily: fonts.monoSemiBold,
          fontSize: 15,
          color: climb.grade === null ? colors.textFaint : colors.gunmetal,
        }}
      >
        {climb.grade === null ? "–" : climbGradeLabel(climb)}
      </Text>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
        >
          {climb.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          {metaLabel(item)}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: colors.gunmetal,
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: sent ? colors.gold : "rgba(64,63,76,0.06)",
          overflow: "hidden",
        }}
      >
        {sent ? t("common.sentStatus") : t("common.open")}
      </Text>
      <Icon name="chevron" size={14} color={colors.textFaint} />
    </Pressable>
  );
}
