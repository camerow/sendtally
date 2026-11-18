import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ItemDone, SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  exerciseName,
  memberSetLabel,
  nextInRound,
  restPreviewAfter,
  roundOn,
  setKey,
  supersetNextLine,
  supersetRoundTitle,
  type RunGroup,
  type SetAt,
} from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { Button } from "../components/Button";
import { DetailMenu } from "../components/DetailMenu";
import { Label } from "../components/Label";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { type } from "../type";
import { SetRow } from "./SetRow";

export type SupersetCardProps = {
  group: RunGroup;
  /** The run's items, sets as many as each has now. */
  items: readonly SessionItem[];
  done: readonly ItemDone[];
  target: (at: SetAt) => SetDone;
  lifting: (item: number) => boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (at: SetAt, value: SetDone) => void;
  onToggle: (at: SetAt) => void;
  holdRow: (at: SetAt) => React.ReactNode;
  go: (at: SetAt) => React.ReactNode;
  restUnder: (at: SetAt) => React.ReactNode;
  onFocus: (at: SetAt) => void;
  onRemoveSet: (at: SetAt) => void;
  /** One more round, for every member. */
  onAddRound: () => void;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
};

/**
 * A superset as one card, round by round: A1, B1, C1, then A2. Every set is live in any order; a
 * rest between members shows only when the superset has one, and the rest after a round between.
 */
export function SupersetCard({
  group,
  items,
  done,
  target,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  onFocus,
  onRemoveSet,
  onAddRound,
  onFold,
  menu,
}: SupersetCardProps): React.ReactElement {
  const setsOf = (m: number): number => done.find((d) => d.item === m)?.sets.length ?? 0;
  const rounds = Math.max(...group.members.map(setsOf));
  const title = supersetRoundTitle(roundOn(items, ticked, group), rounds);
  const nameOf = (m: number): string => exerciseName(items[m]?.exercise ?? "");
  const next = supersetNextLine(
    nextInRound(items, ticked, group)
      .filter((m) => m !== current?.item)
      .map(nameOf)
  );
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ gap: 2, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={onFold}
            accessibilityRole="button"
            accessibilityLabel={t("workouts.foldExercise", { name: title })}
            accessibilityState={{ expanded: true }}
            hitSlop={{ top: 12, bottom: 12 }}
            style={press({ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 })}
          >
            <Text style={[type.bodyBold, { flexShrink: 1, fontSize: 17, color: colors.gunmetal }]}>
              {title}
            </Text>
            <View style={{ transform: [{ rotate: "-90deg" }] }}>
              <Icon name="chevron" size={16} strokeWidth={2} color={colors.textMuted} />
            </View>
          </Pressable>
          <DetailMenu
            rows={menu}
            button={{
              label: t("workouts.exerciseMore"),
              color: colors.textSecondary,
              size: 36,
              iconSize: 20,
            }}
          />
        </View>
        {next !== null && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>{next}</Text>
        )}
      </View>
      {Array.from({ length: rounds }, (_, set) => (
        <React.Fragment key={set}>
          <Label small color={colors.textSecondary} style={{ paddingTop: set === 0 ? 0 : 6 }}>
            {t("workouts.roundN", { n: set + 1 })}
          </Label>
          {group.members.map((item, letter) => {
            const at = { item, set };
            const value = done.find((d) => d.item === item)?.sets[set];
            if (value === undefined) return null;
            const name = nameOf(item);
            const rest = restPreviewAfter(group, (m) => setsOf(m), letter, set);
            return (
              <React.Fragment key={item}>
                {holdRow(at) || (
                  <SetRow
                    n={set + 1}
                    tag={memberSetLabel(letter, set)}
                    name={name}
                    repsMax={items[item]?.dose.repsMax}
                    target={target(at)}
                    done={value}
                    previous={undefined}
                    lifting={lifting(item)}
                    ticked={ticked.has(setKey(at))}
                    current={current?.item === item && current.set === set}
                    unit={unit}
                    label={t("activities.setOf", { exercise: name, n: set + 1 })}
                    onChange={(v) => onChange(at, v)}
                    onToggle={() => onToggle(at)}
                    onFocus={() => onFocus(at)}
                    onRemove={() => onRemoveSet(at)}
                    testID={`set-row-${item}-${set}`}
                    go={go(at) || undefined}
                  />
                )}
                {restUnder(at) || (rest !== null && <RestPreview seconds={rest} />)}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
      <View style={{ flexDirection: "row", paddingTop: 6 }}>
        <Button
          label={t("workouts.addRound")}
          onPress={onAddRound}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
    </View>
  );
}
