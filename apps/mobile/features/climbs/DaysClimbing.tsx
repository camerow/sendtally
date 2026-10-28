import React from "react";
import { ScrollView, Text, View } from "react-native";
import type { ClimbingDay, DaysClimbedVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { sectionLabel } from "./sectionLabel";

const SQUARE = 14;
const GAP = 3;
const STRIP = 28;
const STRIP_GAP = 6;

const DAY_COLORS: Record<ClimbingDay, string> = {
  outside: colors.azureInk,
  gym: "#6F9EE8",
  rest: colors.lineOnLightSoft,
  future: "transparent",
};

const tiny = {
  height: SQUARE,
  fontFamily: fonts.mono,
  fontSize: 9,
  lineHeight: SQUARE,
  color: colors.textMuted,
} as const;

/** A square a day over the range, a column a week from the latest back: outside, gym or rest. */
export function DaysClimbing({ vm }: { vm: DaysClimbedVM }): React.ReactElement {
  const scroll = React.useRef<ScrollView>(null);
  const legend: [ClimbingDay, string][] = [
    ["outside", t("climbs.daysOutsideCount", { count: vm.outside })],
    ["gym", t("climbs.daysGymCount", { count: vm.gym })],
    ["rest", t("climbs.daysRest")],
  ];
  return (
    <View
      style={{
        gap: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <Text accessibilityRole="header" style={sectionLabel}>
        {t("climbs.daysClimbing")}
      </Text>
      {vm.strip.length > 0 ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={vm.label}
          style={{ flexDirection: "row", gap: STRIP_GAP }}
        >
          {vm.strip.map((s, i) => (
            <View key={i} style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: STRIP,
                  height: STRIP,
                  borderRadius: 5,
                  backgroundColor: DAY_COLORS[s.day],
                }}
              />
              <Text style={tiny}>{s.weekday}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View
        style={
          vm.strip.length > 0
            ? undefined
            : { flexDirection: "row", alignItems: "flex-end", gap: 16 }
        }
      >
        {vm.strip.length === 0 && (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={vm.label}
            style={{ flexShrink: 1, flexDirection: "row", gap: GAP }}
          >
            <View style={{ gap: GAP, paddingTop: SQUARE + GAP, marginRight: GAP }}>
              {vm.weekdays.map((d, i) => (
                <Text key={i} style={tiny}>
                  {d}
                </Text>
              ))}
            </View>
            <ScrollView
              ref={scroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 1 }}
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
              contentContainerStyle={{ gap: GAP, paddingRight: 12 }}
            >
              {vm.weeks.map((w, i) => (
                <View key={i} style={{ gap: GAP }}>
                  <View style={{ width: SQUARE, height: SQUARE }}>
                    {w.month !== null && (
                      <Text numberOfLines={1} style={[tiny, { position: "absolute", width: 40 }]}>
                        {w.month}
                      </Text>
                    )}
                  </View>
                  {w.days.map((d, j) => (
                    <View
                      key={j}
                      style={{
                        width: SQUARE,
                        height: SQUARE,
                        borderRadius: 3,
                        backgroundColor: DAY_COLORS[d],
                      }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <View
          style={
            vm.strip.length > 0
              ? { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6 }
              : { gap: 6, paddingBottom: 2 }
          }
        >
          {legend.map(([day, label]) => (
            <View key={day} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View
                style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: DAY_COLORS[day] }}
              />
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12.5,
                  color: day === "rest" ? colors.textSecondary : colors.gunmetal,
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
