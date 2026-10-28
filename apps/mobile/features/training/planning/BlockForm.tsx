import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";
import type { Block } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { usePlan } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { FocusField } from "../components/FocusField";
import { Label } from "../components/Label";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";
import { ScreenFrame } from "./ScreenFrame";
import { StartField } from "./StartField";

const MAX_WEEKS = 16;

const clampWeeks = (n: number): number => Math.min(MAX_WEEKS, Math.max(1, Math.round(n)));

export type BlockFormProps = {
  /** The block as it is, or a new one's starting values with an empty id. */
  initial: Block;
};

/** A block's name, first day, number of weeks and focus. A new one opens on its own screen once saved. */
export function BlockForm({ initial }: BlockFormProps): React.ReactElement {
  const { today } = useHangData();
  const plan = usePlan(useApi()).state;
  const actions = usePlanActions();
  const [block, setBlock] = React.useState(initial);
  const isNew = initial.id === "";
  const update = (patch: Partial<Block>): void => setBlock((b) => ({ ...b, ...patch }));
  const name = block.name.trim();

  const save = (): void => {
    const id = isNew ? randomUUID() : block.id;
    void actions.saveBlock({ ...block, id, name });
    // Weekly plans start with their block, so they move with it.
    if (!isNew && block.start !== initial.start && plan.status === "ready")
      plan.data.memberships
        .filter((m) => m.blockId === id && m.weekdays.length > 0 && m.start === initial.start)
        .forEach((m) => void actions.saveMembership({ ...m, start: block.start }));
    if (isNew) router.replace({ pathname: "/plan/block/[id]", params: { id } });
    else router.back();
  };

  return (
    <ScreenFrame
      action={
        <Button
          label={t("hang.save")}
          onPress={save}
          disabled={name === ""}
          variant="primary"
          height={44}
        />
      }
    >
      <Title size={34}>{isNew ? t("plan.newBlock") : t("plan.editBlock")}</Title>
      <View style={{ gap: 6 }}>
        <Label small color={colors.textSecondary}>
          {t("hang.name")}
        </Label>
        <TextInput
          value={block.name}
          onChangeText={(text) => update({ name: text })}
          placeholder={t("plan.blockNamePlaceholder")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("hang.name")}
          maxLength={80}
          style={[
            type.display,
            {
              height: 52,
              paddingHorizontal: 14,
              borderRadius: 12,
              fontSize: 22,
              color: colors.gunmetal,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
            },
          ]}
        />
      </View>
      <StartField
        value={block.start}
        min={isNew ? today : null}
        onChange={(start) => update({ start })}
      />
      <SheetSection label={t("plan.weeks")}>
        <Stepper
          value={formatNumber(block.weeks)}
          onCommit={(text) => {
            const n = Number(text);
            if (Number.isFinite(n) && n > 0) update({ weeks: clampWeeks(n) });
          }}
          onStep={(direction) => update({ weeks: clampWeeks(block.weeks + direction) })}
          label={t("plan.weeks")}
          decreaseLabel={t("hang.decrease", { field: t("plan.weeks") })}
          increaseLabel={t("hang.increase", { field: t("plan.weeks") })}
          surface="plain"
          keyboard="number-pad"
        />
      </SheetSection>
      <FocusField
        value={block.focus}
        onChange={(focus) => update({ focus })}
        note={t("focus.blockNote")}
      />
    </ScreenFrame>
  );
}
