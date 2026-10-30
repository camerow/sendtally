import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { Block, CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { BlockWeekChips } from "../blocks/BlockWeekChips";
import { Label } from "../components/Label";
import { type } from "../type";

const MAX_WEEKS = 16;

export type TemplateHeaderProps = {
  block: Block;
  today: CalendarDate;
  /** Opens with the name being typed, as a new block does. */
  autoFocus: boolean;
  week: number;
  onPickWeek: (week: number) => void;
  /** The block as typed or stepped, saved as it changes. */
  onSave: (block: Block) => void;
};

/** A template's head, all of it editable: its name, its weeks to pick from, and how many. */
export function TemplateHeader({
  block,
  today,
  autoFocus,
  week,
  onPickWeek,
  onSave,
}: TemplateHeaderProps): React.ReactElement {
  const [name, setName] = React.useState(block.name);
  const [focused, setFocused] = React.useState(autoFocus);
  const saveName = (): void => {
    if (name.trim() !== block.name) onSave({ ...block, name: name.trim() });
  };
  const weeks = (n: number): void => {
    const next = Math.min(MAX_WEEKS, Math.max(1, n));
    if (next !== block.weeks) onSave({ ...block, weeks: next });
    if (week > next) onPickWeek(next);
  };
  const step = (glyph: string, label: string, by: number): React.ReactElement => (
    <Pressable
      onPress={() => weeks(block.weeks + by)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={press({
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 18, color: colors.gunmetal }]}>{glyph}</Text>
    </Pressable>
  );

  return (
    <>
      <View style={{ gap: 4 }}>
        <Label color={colors.textSecondary}>{t("plan.template")}</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            saveName();
          }}
          onSubmitEditing={saveName}
          autoFocus={autoFocus}
          placeholder={t("plan.blockNamePlaceholder")}
          placeholderTextColor="rgba(64,63,76,0.3)"
          accessibilityLabel={t("hang.name")}
          maxLength={80}
          returnKeyType="done"
          style={[
            type.display,
            {
              fontSize: 34,
              lineHeight: 40,
              paddingVertical: 0,
              paddingBottom: 4,
              color: colors.gunmetal,
              borderBottomWidth: 2,
              borderBottomColor: focused ? colors.gold : "rgba(64,63,76,0.14)",
            },
          ]}
        />
      </View>
      <BlockWeekChips block={block} today={today} picked={week} onPick={onPickWeek} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.notScheduled")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {step("−", t("hang.decrease", { field: t("plan.weeks") }), -1)}
          <Text
            style={[
              type.monoBold,
              { minWidth: 62, fontSize: 14, textAlign: "center", color: colors.gunmetal },
            ]}
          >
            {t("calendar.weeks", { count: block.weeks })}
          </Text>
          {step("+", t("hang.increase", { field: t("plan.weeks") }), 1)}
        </View>
      </View>
    </>
  );
}
