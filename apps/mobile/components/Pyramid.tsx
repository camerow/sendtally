import React from "react";
import { Text, View } from "react-native";
import type { PyramidRow } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";

export type PyramidProps = {
  rows: readonly PyramidRow[];
  label: string;
};

const ROW_HEIGHT = 27;
const BAR_HEIGHT = 12;

/** One centred bar per grade, hardest on top: the inner count dark, the rest split either side. */
export function Pyramid({ rows, label }: PyramidProps): React.ReactElement {
  const [width, setWidth] = React.useState(0);
  const widest = Math.max(1, ...rows.map((r) => r.inner + r.outer));
  const unit = width === 0 ? 0 : (width - 2) / widest;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      {rows.map((r) => (
        <View
          key={r.gradeLabel}
          style={{
            height: ROW_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          }}
        >
          <Text
            style={{
              width: 38,
              fontFamily: fonts.monoSemiBold,
              fontSize: 12,
              color: colors.gunmetal,
            }}
          >
            {r.gradeLabel}
          </Text>
          <View
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              gap: r.inner > 0 && r.outer > 0 ? 1 : 0,
            }}
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
          <Text
            style={{
              width: 34,
              textAlign: "right",
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textSecondary,
            }}
          >
            {r.countLabel}
          </Text>
        </View>
      ))}
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
