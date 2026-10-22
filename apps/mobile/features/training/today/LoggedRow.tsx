import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, effortColor } from "@sendtally/design/tokens";
import type { MarkKind } from "@sendtally/features/training";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK } from "./kindLook";
import type { LoggedRowText } from "./loggedRowText";

export type LoggedRowProps = { kind: MarkKind; text: LoggedRowText; onPress: () => void };

/** A session or activity logged on the selected day, with its effort. */
export function LoggedRow({ kind, text, onPress }: LoggedRowProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.white,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: look.tint,
        }}
      >
        {kind === "climb" || kind === "hang" ? (
          <Icon name={kind} color={look.ink} size={20} strokeWidth={1.9} />
        ) : (
          <DayMark kind={kind} filled scale={1.5} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {text.name}
        </Text>
        <Text numberOfLines={1} style={[type.labelSmall, { color: colors.textSecondary }]}>
          {text.meta}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        {text.right !== "" && (
          <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>
            {text.right}
          </Text>
        )}
        {text.rpe !== null && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: effortColor(text.rpe),
              }}
            />
            <Label small color={colors.gunmetal}>
              {t("hang.rpeValue", { value: text.rpe })}
            </Label>
          </View>
        )}
      </View>
    </Pressable>
  );
}
