import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { LoadVM } from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { type } from "../type";
import { CardRow } from "./CardRow";
import { LoadChart } from "./LoadChart";
import { NotCountedSheet } from "./NotCountedSheet";

/** Load over the range: an average week a bar, the average over the range, and what was left out. */
export function LoadCard({
  load,
  plotHeight,
  bare = false,
}: {
  load: LoadVM;
  /** The bar plot's height, LoadChart's own unless given. */
  plotHeight?: number;
  /** The content alone, with no frame, for a picture set inside another card. */
  bare?: boolean;
}): React.ReactElement {
  const [hit, setHit] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const bar = hit === null ? null : (load.bars[hit] ?? null);

  return (
    <>
      <View
        style={[
          { gap: 10 },
          !bare && {
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.lineOnLight,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Label color={colors.gunmetal}>{t("statistics.loadTitle")}</Label>
          <Text
            style={[type.mono, { fontSize: 12, color: colors.textSecondary, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {load.caption}
          </Text>
        </View>
        {load.state === "none" ? (
          <Text style={[type.display, { fontSize: 32, lineHeight: 36, color: colors.textFaint }]}>
            {load.headline}
          </Text>
        ) : (
          <View
            accessibilityLiveRegion="polite"
            style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
          >
            <Text
              style={[
                type.display,
                { fontSize: bar === null ? 40 : 46, lineHeight: 44, color: colors.gunmetal },
              ]}
            >
              {bar?.text ?? load.headline}
            </Text>
            {bar === null && (
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {load.unit}
              </Text>
            )}
          </View>
        )}
        {bar !== null ? (
          <Text style={[type.mono, { fontSize: 12.5, lineHeight: 18, color: colors.gunmetal }]}>
            {bar.readout}
          </Text>
        ) : load.sentence !== null ? (
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.gunmetal }]}>
            {load.sentence}
          </Text>
        ) : null}
        <LoadChart
          load={load}
          hit={hit}
          onHit={setHit}
          {...(plotHeight !== undefined && { height: plotHeight })}
        />
        {load.note !== null && (
          <Text
            style={[type.mono, { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary }]}
          >
            {load.note}
          </Text>
        )}
        {load.leftOutLine !== null && (
          <View>
            <CardRow onPress={() => setOpen(true)}>{load.leftOutLine}</CardRow>
          </View>
        )}
      </View>
      <NotCountedSheet rows={load.leftOut} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
