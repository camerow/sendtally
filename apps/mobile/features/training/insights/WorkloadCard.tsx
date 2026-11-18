import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  WORKLOAD_TINTS,
  WORKLOAD_WINDOWS,
  workloadZoneLabel,
  type WorkloadVM,
  type WorkloadWeeks,
} from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";
import { Segmented } from "../../../components/Segmented";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";
import { WorkloadChart } from "./WorkloadChart";
import { WorkloadSheet } from "./WorkloadSheet";

function Row({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: colors.lineOnLight,
      })}
    >
      <Text style={[type.mono, { flex: 1, fontSize: 12.5, color: colors.gunmetal }]}>
        {children}
      </Text>
      <Icon name="chevron" color={colors.textSecondary} size={16} />
    </Pressable>
  );
}

function Weeks({ days }: { days: number }): React.ReactElement {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 4, height: 10 }}>
        {[0, 1, 2, 3].map((w) => (
          <View
            key={w}
            style={{
              flex: 1,
              borderRadius: 3,
              backgroundColor: days > w * 7 ? colors.gunmetal : colors.dataBarEmpty,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
          {t("statistics.workloadWeek1")}
        </Text>
        <Text style={[type.mono, { fontSize: 10, color: colors.textSecondary }]}>
          {t("statistics.workloadWeek4")}
        </Text>
      </View>
    </View>
  );
}

/** This week's load against the last four: the ratio and its zone in words, the line, and the loads behind it. */
export function WorkloadCard({
  workload: w,
  weeks,
  onWeeks,
}: {
  workload: WorkloadVM;
  weeks: WorkloadWeeks;
  onWeeks: (weeks: WorkloadWeeks) => void;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const average = w.chronic;

  return (
    <>
      <View
        style={{
          gap: 10,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.lineOnLight,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Label color={colors.gunmetal}>{t("statistics.workloadTitle")}</Label>
          <Text
            style={[type.mono, { fontSize: 12, color: colors.textSecondary, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {t("statistics.workloadCaption")}
          </Text>
        </View>
        {w.zone !== null && w.ratio !== null ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={[type.display, { fontSize: 40, lineHeight: 44, color: colors.gunmetal }]}>
              {w.ratio}
            </Text>
            <Label
              color={colors.gunmetal}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: WORKLOAD_TINTS[w.zone],
              }}
            >
              {workloadZoneLabel(w.zone)}
            </Label>
          </View>
        ) : (
          <Text
            style={[
              type.display,
              {
                fontSize: 32,
                lineHeight: 36,
                color: w.state === "early" ? colors.textFaint : colors.gunmetal,
              },
            ]}
          >
            {w.headline}
          </Text>
        )}
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.gunmetal }]}>
          {w.sentence}
        </Text>
        {w.state === "early" ? (
          <Weeks days={w.daysLogged} />
        ) : w.points.length > 0 ? (
          <>
            <Segmented
              soft
              label={t("statistics.workloadTitle")}
              segments={WORKLOAD_WINDOWS.map((n) => ({
                key: String(n),
                label: t("common.weekCount", { count: n }),
                on: n === weeks,
                onPress: () => onWeeks(n),
              }))}
            />
            <WorkloadChart points={w.points} from={w.from} weeks={weeks} />
          </>
        ) : null}
        <View>
          <Row onPress={() => setOpen(true)}>
            {t("statistics.workloadLast7")} <Text style={type.monoBold}>{w.acute}</Text>
            {average === null ? null : (
              <>
                {` · ${t("statistics.workloadAverage")} `}
                <Text style={type.monoBold}>{average}</Text>
              </>
            )}
          </Row>
          {w.leftOutLine !== null && <Row onPress={() => setOpen(true)}>{w.leftOutLine}</Row>}
        </View>
      </View>
      <WorkloadSheet workload={w} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
