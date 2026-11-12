import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { isDated, type Block, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { BlockWeekChips } from "../blocks/BlockWeekChips";
import { blockDateRange } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { type } from "../type";

const MAX_WEEKS = 16;

export type BlockHeaderProps = {
  block: Block;
  today: CalendarDate;
  /** Its name, length and first day as fields; plain text while reading. */
  editing: boolean;
  /** The name it has saved, which a scheduled block keeps when the field is emptied. */
  savedName: string;
  /** Opens with the name being typed, as a new block does. */
  autoFocus: boolean;
  week: number;
  onPickWeek: (week: number) => void;
  /** The block as typed or stepped. */
  onSave: (block: Block) => void;
  /** The fewest weeks it can step down to: a running block keeps the weeks it has run. */
  minWeeks?: number;
  /** Opens the calendar to move its first day; none once it has started. */
  onMoveStart?: () => void;
};

/**
 * A block's head: its name, its dates, and its weeks to pick from. In Edit mode the name is
 * typed, the weeks stepped, and a scheduled block's dates move until it starts.
 */
export function BlockHeader({
  block,
  today,
  editing,
  savedName,
  autoFocus,
  week,
  onPickWeek,
  onSave,
  minWeeks = 1,
  onMoveStart,
}: BlockHeaderProps): React.ReactElement {
  const dated = isDated(block) ? block : null;
  const [name, setName] = React.useState(block.name);
  const [focused, setFocused] = React.useState(autoFocus);
  // A scheduled block keeps a name: an emptied one goes back to what it was.
  const kept = (typed: string): string => (typed === "" && dated !== null ? savedName : typed);
  const typeName = (text: string): void => {
    setName(text);
    onSave({ ...block, name: kept(text.trim()) });
  };
  const weeks = (n: number): void => {
    const next = Math.min(MAX_WEEKS, Math.max(minWeeks, n));
    if (next !== block.weeks) onSave({ ...block, weeks: next });
    if (week > next) onPickWeek(next);
  };
  const step = (glyph: string, label: string, by: number): React.ReactElement => {
    const disabled = by < 0 ? block.weeks <= minWeeks : block.weeks >= MAX_WEEKS;
    return (
      <Pressable
        onPress={() => weeks(block.weeks + by)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={press({
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
          opacity: disabled ? 0.4 : 1,
        })}
      >
        <Text style={[type.bodyBold, { fontSize: 18, color: colors.gunmetal }]}>{glyph}</Text>
      </Pressable>
    );
  };
  const when = (
    <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
      {dated === null ? t("plan.notScheduled") : blockDateRange(dated)}
    </Text>
  );

  const chips = <BlockWeekChips block={block} today={today} picked={week} onPick={onPickWeek} />;
  const kicker = (
    <Label color={colors.textSecondary}>
      {dated === null ? t("plan.template") : t("plan.scheduled")}
    </Label>
  );
  if (!editing)
    return (
      <>
        <View style={{ gap: 4 }}>
          {kicker}
          <Title size={34}>{block.name || t("plan.untitled")}</Title>
          {when}
        </View>
        {chips}
      </>
    );

  return (
    <>
      <View style={{ gap: 4 }}>
        {kicker}
        <TextInput
          value={name}
          onChangeText={typeName}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setName(kept(name.trim()));
          }}
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
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          rowGap: 10,
        }}
      >
        {onMoveStart === undefined ? (
          when
        ) : (
          <Pressable
            onPress={onMoveStart}
            accessibilityRole="button"
            accessibilityLabel={t("plan.moveStart")}
            hitSlop={8}
            style={press({ flexDirection: "row", alignItems: "center", gap: 6 })}
          >
            {when}
            <Text style={[type.bodyBold, { fontSize: 13, color: colors.azure }]}>
              {t("plan.move")}
            </Text>
          </Pressable>
        )}
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
      {chips}
    </>
  );
}
