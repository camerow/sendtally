import React from "react";
import { Text, View } from "react-native";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { MenuRow } from "../live-session/MenuRow";
import { Button } from "../training/components/Button";
import { ExampleRow } from "./ExampleRow";
import { SectionHeader } from "./SectionHeader";
import type { ExampleRowData, LogEmptyAction } from "./types";

export type LogEmptyProps = {
  /** The preview month's count, such as "2 sessions". */
  count: string;
  examples: readonly ExampleRowData[];
  title: string;
  primary: { label: string; onPress: () => void };
  actions: readonly LogEmptyAction[];
};

/**
 * An empty half of the log: a faded month of made-up rows to show what fills it, then the
 * common way to start and the other ways in. It stands in for the log button until then.
 */
export function LogEmpty({
  count,
  examples,
  title,
  primary,
  actions,
}: LogEmptyProps): React.ReactElement {
  const [now] = React.useState(() => new Date());
  return (
    <View style={{ paddingTop: 6 }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ opacity: 0.45 }}>
          <SectionHeader
            title={formatDate(now, { month: "long" })}
            meta={t("sessions.monthMeta", { year: now.getFullYear(), sessions: count })}
          />
          {examples.map((row) => (
            <ExampleRow key={row.title} row={row} now={now} />
          ))}
        </View>
        <Text
          style={{
            position: "absolute",
            right: 18,
            top: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: colors.surfaceSoft,
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textSecondary,
          }}
        >
          {t("sessions.example")}
        </Text>
      </View>
      <View style={{ alignItems: "center", gap: 16, paddingHorizontal: 18, paddingTop: 24 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            letterSpacing: -0.5,
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <Button
          label={primary.label}
          onPress={primary.onPress}
          variant="gold"
          icon="plus"
          height={52}
          style={{ alignSelf: "stretch" }}
        />
        <View
          style={{
            alignSelf: "stretch",
            gap: 4,
            padding: 4,
            borderRadius: 20,
            backgroundColor: colors.surfaceSoft,
          }}
        >
          {actions.map(({ key, ...action }) => (
            <View key={key} style={{ borderRadius: 16, backgroundColor: colors.white }}>
              <MenuRow {...action} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
