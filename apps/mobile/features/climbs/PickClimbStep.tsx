import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { areaClimbGradeLabel, useAreaClimbSearch, type AreaClimb } from "@sendtally/features/areas";
import { climbGradeLabel, climbProgressLabel } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { TextInput } from "../../components/TextInput";
import { useApi } from "../../lib/api";
import { pressRow } from "../../lib/press";
import { AreaSearchField, type PickedArea } from "../areas/AreaSearchField";
import { ClimbListRow } from "./ClimbListRow";
import { CragBox } from "./CragBox";

export type PickClimbStepProps = {
  area: PickedArea | null;
  climbs: readonly ClimbSummary[];
  changingArea: boolean;
  onChangeArea: () => void;
  onArea: (area: PickedArea | null) => void;
  onMine: (climb: ClimbSummary) => void;
  onAreas: (climb: AreaClimb) => void;
  onNew: (name: string) => void;
};

const MAX_MINE = 12;

const heading = {
  paddingVertical: 4,
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.gunmetal,
} as const;

/** Your climbs at this crag first, then the crag's own from Areas, then one not listed. */
export function PickClimbStep({
  area,
  climbs,
  changingArea,
  onChangeArea,
  onArea,
  onMine,
  onAreas,
  onNew,
}: PickClimbStepProps): React.ReactElement {
  const api = useApi();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const mine = climbs
    .filter((c) => area === null || c.area?.id === area.id)
    .filter((c) => q === "" || c.name.toLowerCase().includes(q))
    .slice(0, MAX_MINE);
  const linked = new Set(
    climbs.flatMap((c) => (c.area_climb_id === null ? [] : [c.area_climb_id]))
  );
  const { found } = useAreaClimbSearch(api, query, area?.id ?? null, area !== null);
  const atCrag = found.filter((c) => !linked.has(c.id));

  return (
    <View style={{ gap: 14 }}>
      {changingArea ? (
        <AreaSearchField
          crags
          value={area}
          label={t("areas.crag")}
          placeholder={t("areas.searchCrags")}
          onPick={(picked) => onArea(picked === null ? null : { id: picked.id, name: picked.name })}
        />
      ) : (
        <CragBox name={area?.name ?? null} onChange={onChangeArea} />
      )}
      <View
        style={{
          minHeight: 50,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          borderRadius: radius.control + 2,
          backgroundColor: colors.surfaceSoft,
        }}
      >
        <Icon name="search" color={colors.textSecondary} size={18} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          placeholder={area === null ? t("climbs.searchYours") : t("climbs.searchHere")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("climbs.searchHere")}
          style={{
            flex: 1,
            minHeight: 48,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
          }}
        />
      </View>
      {mine.length > 0 && (
        <View>
          <Text accessibilityRole="header" style={heading}>
            {t("climbs.yours")}
          </Text>
          {mine.map((c) => (
            <ClimbListRow
              key={c.id}
              gradeLabel={climbGradeLabel(c)}
              name={c.name}
              meta={climbProgressLabel(c)}
              chevron={false}
              onPress={() => onMine(c)}
            />
          ))}
        </View>
      )}
      {area !== null && atCrag.length > 0 && (
        <View>
          <Text accessibilityRole="header" style={heading}>
            {t("climbs.atCrag", { crag: area.name })}
          </Text>
          {atCrag.map((c) => (
            <ClimbListRow
              key={c.id}
              gradeLabel={areaClimbGradeLabel(c)}
              name={c.name}
              meta=""
              chevron={false}
              onPress={() => onAreas(c)}
            />
          ))}
        </View>
      )}
      <Pressable
        onPress={() => onNew(query.trim())}
        accessibilityRole="button"
        style={pressRow({ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 })}
      >
        <Icon name="plus" color={colors.gunmetal} size={18} strokeWidth={2.2} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
          {t("climbs.notListed")}
        </Text>
      </Pressable>
    </View>
  );
}
