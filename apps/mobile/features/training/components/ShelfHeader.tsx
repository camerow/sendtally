import React from "react";
import { Pressable, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { CategoryMark } from "../library/CategoryMark";
import { HangIcon } from "./HangIcon";
import { IconButton } from "./IconButton";
import { Label } from "./Label";
import { Title } from "./Title";

export type ShelfHeaderProps = {
  title: string;
  /** The category whose mark leads the title. */
  kind?: WorkoutKind;
  /** Greyed, for the shelf of what has no category. */
  muted?: boolean;
  /** Opens the whole shelf; left out on an empty one, which offers only the plus. */
  onSeeAll?: () => void;
  addLabel: string;
  onAdd: () => void;
};

/** A shelf's heading: its mark, name and See all as one button, and a plus to make one in it. */
export function ShelfHeader({
  title,
  kind,
  muted = false,
  onSeeAll,
  addLabel,
  onAdd,
}: ShelfHeaderProps): React.ReactElement {
  const heading = (
    <>
      {kind !== undefined && <CategoryMark kind={kind} size={28} />}
      <View style={{ flexShrink: 1, flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Title
          size={26}
          color={muted ? colors.textMuted : colors.gunmetal}
          style={{ flexShrink: 1 }}
        >
          {title}
        </Title>
        {onSeeAll !== undefined && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Label color={colors.textSecondary}>{t("workouts.seeAll")}</Label>
            <HangIcon name="forward" color={colors.textSecondary} size={14} strokeWidth={2.2} />
          </View>
        )}
      </View>
    </>
  );
  const row = {
    flexShrink: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  } as const;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {onSeeAll === undefined ? (
        <View style={row}>{heading}</View>
      ) : (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={t("workouts.seeAllOf", { kind: title })}
          style={press(row)}
        >
          {heading}
        </Pressable>
      )}
      <View style={{ flex: 1 }} />
      <IconButton
        icon="plus"
        label={addLabel}
        onPress={onAdd}
        color={colors.gunmetal}
        border={colors.lineOnLightStrong}
        size={30}
      />
    </View>
  );
}
