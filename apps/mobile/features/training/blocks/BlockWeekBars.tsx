import React from "react";
import { Text, View } from "react-native";
import { colors, effortColor } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { BlockWeek } from "@sendtally/features/training";
import { ON_DARK_MUTED, ON_DARK_TRACK } from "../components/onDark";
import { type } from "../type";

export type BlockWeekBarsProps = {
  weeks: readonly BlockWeek[];
  /** Small bars with no labels, on the dark log card. */
  compact?: boolean;
};

const fill = (w: BlockWeek): number => (w.planned === 0 ? 0 : w.done / w.planned);

const weekLabel = (w: BlockWeek): string =>
  [
    t("plan.weekShort", { n: w.week }),
    ...(w.effort === null ? [] : [`RPE ${formatNumber(Math.round(w.effort))}`]),
  ].join(" · ");

/** A column per week, filled as far as its sessions were done and coloured by its effort. */
export function BlockWeekBars({ weeks, compact = false }: BlockWeekBarsProps): React.ReactElement {
  const height = compact ? 28 : 96;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: compact ? 3 : 8 }}>
      {weeks.map((w) => (
        <View
          key={w.week}
          accessible={!compact}
          accessibilityLabel={`${weekLabel(w)}, ${t("plan.doneOf", { done: w.done, planned: w.planned })}`}
          style={{ flex: compact ? undefined : 1, width: compact ? 6 : undefined, gap: 6 }}
        >
          {!compact && (
            <Text style={[type.monoBold, { fontSize: 12, color: colors.gunmetal }]}>
              {`${formatNumber(w.done)}/${formatNumber(w.planned)}`}
            </Text>
          )}
          <View
            style={{
              height,
              justifyContent: "flex-end",
              borderRadius: compact ? 2 : 8,
              overflow: "hidden",
              backgroundColor: compact ? ON_DARK_TRACK : colors.surfaceSoft,
            }}
          >
            <View
              style={{
                height: `${Math.round(fill(w) * 100)}%`,
                backgroundColor:
                  w.effort !== null
                    ? effortColor(w.effort)
                    : compact
                      ? ON_DARK_MUTED
                      : colors.dataBarEmpty,
              }}
            />
          </View>
          {!compact && (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[type.mono, { fontSize: 11, color: colors.textSecondary }]}
            >
              {weekLabel(w)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
