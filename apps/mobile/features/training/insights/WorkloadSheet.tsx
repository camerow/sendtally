import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { DoneRef, WorkloadTileVM, WorkloadVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

const BAR = 82;
const GUTTER = 44;

function open(ref: DoneRef): void {
  if (ref.type === "session")
    router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: ref.id } });
  else router.push({ pathname: "/activity/[id]", params: { id: ref.id } });
}

function Tile({ label, value, note, counted }: WorkloadTileVM): React.ReactElement {
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
      {counted !== null && (
        <Text style={[type.mono, { fontSize: 11, color: colors.gunmetal }]}>{counted}</Text>
      )}
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
  const top = Math.max(s.average, ...s.weeks.map((x) => x.load), 1);
  const averageAt = (s.average / top) * BAR;
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.close")}>
      <View style={{ paddingHorizontal: 18, gap: 14 }}>
        <Text style={[type.display, { fontSize: 22, color: colors.gunmetal }]}>
          {t("statistics.workloadTitle")}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {s.tiles.map((tile) => (
            <Tile key={tile.label} {...tile} />
          ))}
        </View>
        <Text style={[type.mono, { fontSize: 13, color: colors.gunmetal }]}>{s.footer}</Text>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", gap: 8, height: BAR }}>
            <View style={{ flex: 1, flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
              {s.weeks.map((week, i) => {
                const last = i === s.weeks.length - 1;
                return (
                  <View
                    key={week.label}
                    style={{
                      flex: 1,
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
                );
              })}
              {s.average > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: averageAt - 1,
                    height: 2,
                  }}
                >
                  <Svg width="100%" height={2}>
                    <Line
                      x1="0"
                      x2="100%"
                      y1={1}
                      y2={1}
                      stroke={colors.gunmetal}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  </Svg>
                </View>
              )}
            </View>
            <View style={{ width: GUTTER }}>
              {s.average > 0 && (
                <Text
                  style={[
                    type.monoBold,
                    {
                      position: "absolute",
                      left: 0,
                      bottom: averageAt - 7,
                      fontSize: 11,
                      color: colors.gunmetal,
                    },
                  ]}
                >
                  {s.averageLabel}
                </Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
              {s.weeks.map((week) => (
                <View key={week.label} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                  <Text style={[type.mono, { fontSize: 11, color: colors.gunmetal }]}>
                    {week.value}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}
                  >
                    {week.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ width: GUTTER }} />
          </View>
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
