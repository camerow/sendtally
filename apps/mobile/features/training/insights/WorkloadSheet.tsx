import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { DoneRef, WorkloadVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

const BAR = 82;

function open(ref: DoneRef): void {
  if (ref.type === "session")
    router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: ref.id } });
  else router.push({ pathname: "/activity/[id]", params: { id: ref.id } });
}

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.surfaceSoft,
        gap: 4,
      }}
    >
      <Label color={colors.textSecondary} small>
        {label}
      </Label>
      <Text style={[type.display, { fontSize: 26, color: colors.gunmetal }]}>{value}</Text>
      <Text style={[type.mono, { fontSize: 11, color: colors.textSecondary }]}>{note}</Text>
    </View>
  );
}

/** The loads behind the ratio: both sums, the division, the four weeks, and what was left out. */
export function WorkloadSheet({
  workload: w,
  visible,
  onClose,
}: {
  workload: WorkloadVM;
  visible: boolean;
  onClose: () => void;
}): React.ReactElement {
  const s = w.sheet;
  const partial = w.state === "partial";
  const top = Math.max(s.average, ...s.weeks.map((x) => x.load), 1);
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.close")}>
      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}
        >
          <Text style={[type.display, { fontSize: 22, color: colors.gunmetal }]}>
            {t("statistics.workloadTitle")}
          </Text>
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{s.span}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Tile
            label={t("statistics.workloadLast7")}
            value={w.acute}
            note={partial ? s.weekCounted : t("statistics.workloadLast7Note")}
          />
          {w.state !== "break" && (
            <Tile
              label={t("statistics.workloadAverage")}
              value={w.chronic ?? t("statistics.workloadAfter4")}
              note={partial ? s.monthCounted : t("statistics.workloadAverageNote")}
            />
          )}
        </View>
        <Text style={[type.mono, { fontSize: 13, color: colors.gunmetal }]}>
          {s.division ?? (partial ? t("statistics.workloadNoZone") : w.sentence)}
        </Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end", height: BAR + 48 }}>
          {s.weeks.map((week, i) => {
            const last = i === s.weeks.length - 1;
            return (
              <View key={week.label} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <Text style={[type.mono, { fontSize: 11, color: colors.gunmetal }]}>
                  {week.value}
                </Text>
                <View
                  style={{
                    width: "100%",
                    height: Math.max(2, (week.load / top) * BAR),
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    borderBottomLeftRadius: 2,
                    borderBottomRightRadius: 2,
                    backgroundColor: last ? colors.gold : colors.lineOnLightStrong,
                    borderWidth: last ? 1.5 : 0,
                    borderColor: colors.gunmetal,
                  }}
                />
                <Label color={colors.textSecondary} small style={{ fontSize: 9.5 }}>
                  {week.label}
                </Label>
              </View>
            );
          })}
          {s.average > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 21 + (s.average / top) * BAR,
                borderTopWidth: 1.5,
                borderStyle: "dashed",
                borderColor: colors.gunmetal,
              }}
            />
          )}
        </View>
        <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
          {t("statistics.workloadBarsNote")}
        </Text>
        {s.leftOut.length > 0 && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.lineOnLight,
              paddingTop: 10,
              gap: 2,
            }}
          >
            <Label color={colors.textSecondary} small>
              {t("statistics.workloadNotCounted")}
            </Label>
            {s.leftOut.map((l) => (
              <Pressable
                key={`${l.ref.type}${l.ref.id}`}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  open(l.ref);
                }}
                style={pressRow({
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                })}
              >
                <Text
                  style={[type.body, { flex: 1, fontSize: 14.5, color: colors.gunmetal }]}
                  numberOfLines={1}
                >
                  {l.ref.name}
                </Text>
                <Text
                  style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}
                >{`${l.detail} ›`}</Text>
              </Pressable>
            ))}
            <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
              {t("statistics.workloadOpensRecord")}
            </Text>
          </View>
        )}
      </View>
    </Sheet>
  );
}
