import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import type { PyramidRow } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";

export type PyramidProps = {
  rows: readonly PyramidRow[];
  label: string;
};

const ROW_HEIGHT = 27;
const BAR_HEIGHT = 12;
const GAP = 8;

const cell: ViewStyle = {
  height: ROW_HEIGHT,
  justifyContent: "center",
  borderBottomWidth: 1,
  borderBottomColor: colors.lineOnLightSoft,
};

/** One centred bar per grade, hardest on top: the inner count dark, the rest split either side; the counts share a column as wide as the widest. */
export function Pyramid({ rows, label }: PyramidProps): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const widest = Math.max(1, ...rows.map((r) => r.inner + r.outer));
  const unit = width === 0 ? 0 : (width - 2) / widest;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: "row" }}
    >
      <View>
        {rows.map((r) => (
          <View key={r.gradeLabel} style={[cell, { width: 38 + GAP }]}>
            <Text style={{ fontFamily: fonts.monoSemiBold, fontSize: 12, color: colors.gunmetal }}>
              {r.gradeLabel}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {rows.map((r) => (
          <View
            key={r.gradeLabel}
            style={[
              cell,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: r.inner > 0 && r.outer > 0 ? 1 : 0,
              },
            ]}
          >
            {r.outer > 0 && <Side width={(r.outer / 2) * unit} left />}
            {r.inner > 0 && (
              <View
                style={{
                  width: r.inner * unit,
                  height: BAR_HEIGHT,
                  backgroundColor: colors.azureInk,
                  borderRadius: r.outer > 0 ? 0 : 3,
                }}
              />
            )}
            {r.outer > 0 && <Side width={(r.outer / 2) * unit} left={false} />}
          </View>
        ))}
      </View>
      <View>
        {rows.map((r) => (
          <View key={r.gradeLabel} style={[cell, { paddingLeft: GAP, alignItems: "flex-end" }]}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}
            >
              {r.countLabel}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Side({ width, left }: { width: number; left: boolean }): React.ReactElement {
  return (
    <View
      style={{
        width,
        height: BAR_HEIGHT,
        backgroundColor: colors.dataAzureSoft,
        borderTopLeftRadius: left ? 3 : 0,
        borderBottomLeftRadius: left ? 3 : 0,
        borderTopRightRadius: left ? 0 : 3,
        borderBottomRightRadius: left ? 0 : 3,
      }}
    />
  );
}
