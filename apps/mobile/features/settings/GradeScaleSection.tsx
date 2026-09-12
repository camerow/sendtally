import React from "react";
import { Text, View } from "react-native";
import type { GradeScales } from "@sendtally/api-client";
import type { GradeScalesFeature } from "@sendtally/features/settings";
import { Chip } from "../../components/Chip";
import { bodyText } from "../../lib/styles";

export type GradeScaleSectionProps = {
  scales: GradeScalesFeature;
};

const ROWS: Array<{
  title: string;
  options: Array<{ label: string; patch: Partial<GradeScales> }>;
  active: (current: GradeScales) => string;
}> = [
  {
    title: "Boulders",
    options: [
      { label: "V", patch: { boulder: "v" } },
      { label: "FONT", patch: { boulder: "font" } },
    ],
    active: (current) => (current.boulder === "v" ? "V" : "FONT"),
  },
  {
    title: "Routes",
    options: [
      { label: "YDS", patch: { route: "yds" } },
      { label: "FRENCH", patch: { route: "french" } },
    ],
    active: (current) => (current.route === "yds" ? "YDS" : "FRENCH"),
  },
];

export function GradeScaleSection({ scales }: GradeScaleSectionProps): React.ReactElement {
  return (
    <>
      <Text style={bodyText}>
        The scale you read grades in. Used wherever we show a grade without asking, and as the
        starting scale for a new session.
      </Text>
      {ROWS.map((row) => {
        const active = row.active(scales.scales);
        return (
          <View
            key={row.title}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={bodyText}>{row.title}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {row.options.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  active={option.label === active}
                  disabled={scales.busy}
                  onPress={() => scales.set(option.patch)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
}
