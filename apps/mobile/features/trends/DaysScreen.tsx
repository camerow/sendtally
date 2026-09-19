import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useDaysTrends, type DayCellVM, type DaysVM } from "@sendtally/features/trends";
import { useApi } from "../../lib/api";
import { SERIES_COLOUR } from "./series";
import { card, monoLabel } from "./styles";
import { TrendStats } from "./TrendStats";
import { TrendTile } from "./TrendTile";

const CELL = 13;
const GAP = 3;
const FILL = {
  none: colors.lineOnLightSoft,
  indoor: SERIES_COLOUR.inside,
  outdoor: SERIES_COLOUR.outside,
  void: "transparent",
} as const;

export function DaysScreen(): React.ReactElement {
  const state = useDaysTrends(useApi());
  return (
    <>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: fonts.display,
          fontSize: 32,
          letterSpacing: -0.8,
          color: colors.gunmetal,
        }}
      >
        {t("trends.daysClimbing")}
      </Text>
      {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
      {state.status === "error" && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
          {t("trends.loadFailedMobile")}
        </Text>
      )}
      {state.status === "ready" && (
        <>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 15,
              lineHeight: 22,
              color: colors.textSecondary,
            }}
          >
            {state.data.lead}
          </Text>
          <TrendStats stats={state.data.stats} />
          <Calendar vm={state.data} />
          {state.data.tiles.map((tile) => (
            <View key={tile.id} style={card}>
              <TrendTile tile={tile} />
            </View>
          ))}
          {state.data.tags.length > 0 && <DaysByTag vm={state.data} />}
        </>
      )}
    </>
  );
}

function Calendar({ vm }: { vm: DaysVM }): React.ReactElement {
  const [hit, setHit] = React.useState<DayCellVM | null>(null);
  const scroll = React.useRef<ScrollView>(null);
  return (
    <View style={{ ...card, padding: 18, gap: 12 }}>
      <View style={{ gap: 4, minHeight: 48 }}>
        <Text
          style={{ ...monoLabel, color: hit === null ? colors.textSecondary : colors.labelAccent }}
        >
          {hit?.date ?? t("trends.range1y")}
        </Text>
        <Text
          style={{
            fontFamily: hit === null ? fonts.display : fonts.displayHeavy,
            fontSize: 18,
            color: colors.gunmetal,
          }}
        >
          {hit?.detail ?? vm.summary}
        </Text>
      </View>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", gap: GAP, height: 12 }}>
            {vm.monthMarks.map((m, i) => (
              <Text
                key={i}
                style={{
                  width: CELL,
                  overflow: "visible",
                  fontFamily: fonts.mono,
                  fontSize: 8,
                  color: colors.textSecondary,
                }}
                numberOfLines={1}
              >
                {m}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: GAP }}>
            {vm.weeks.map((week) => (
              <View key={week[0]!.key} style={{ gap: GAP }}>
                {week.map((c) => (
                  <Pressable
                    key={c.key}
                    disabled={c.state === "void"}
                    accessibilityLabel={`${c.date}: ${c.detail}`}
                    onPress={() => setHit((h) => (h?.key === c.key ? null : c))}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      backgroundColor: FILL[c.state],
                      borderWidth: hit?.key === c.key ? 2 : 0,
                      borderColor: colors.gunmetal,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 14 }}>
        {[
          [t("trends.seriesInside"), FILL.indoor],
          [t("trends.seriesOutside"), FILL.outdoor],
          [t("trends.seriesRest"), FILL.none],
        ].map(([label, fill]) => (
          <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: fill }} />
            <Text style={{ ...monoLabel, fontSize: 9 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DaysByTag({ vm }: { vm: DaysVM }): React.ReactElement {
  const [hit, setHit] = React.useState<number | null>(null);
  const row = hit === null ? null : vm.tags[hit];
  return (
    <View style={{ ...card, padding: 18, gap: 8 }}>
      <Text style={{ ...monoLabel, fontSize: 13, color: colors.labelAccent }}>
        {t("trends.daysByTag")}
      </Text>
      <Text
        style={{
          fontFamily: row == null ? fonts.display : fonts.displayHeavy,
          fontSize: 28,
          color: colors.gunmetal,
        }}
      >
        {row == null
          ? t("trends.tagCount", { count: vm.tags.length })
          : t("trends.dayCount", { count: row.total })}
      </Text>
      <Text
        style={{ ...monoLabel, color: row == null ? colors.textSecondary : colors.labelAccent }}
      >
        {row == null
          ? t("trends.daysByTagCaption")
          : t("trends.tagDays", { tag: row.name, inside: row.inside, outside: row.outside })}
      </Text>
      {vm.tags.slice(0, 8).map((g, i) => (
        <Pressable
          key={g.slug}
          onPress={() => setHit((h) => (h === i ? null : i))}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minHeight: 36,
            opacity: hit === null || hit === i ? 1 : 0.4,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              width: 96,
              fontFamily: fonts.sansMedium,
              fontSize: 14,
              color: colors.gunmetal,
            }}
          >
            {g.name}
          </Text>
          <View style={{ flex: 1, flexDirection: "row", gap: 2, height: 12 }}>
            <View
              style={{
                width: `${g.insideRatio * 100}%`,
                backgroundColor: FILL.indoor,
                borderRadius: 3,
              }}
            />
            <View
              style={{
                width: `${g.outsideRatio * 100}%`,
                backgroundColor: FILL.outdoor,
                borderRadius: 3,
              }}
            />
          </View>
          <Text
            style={{
              width: 30,
              textAlign: "right",
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.gunmetal,
            }}
          >
            {g.total}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
