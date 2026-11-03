import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkoutDoneVM, WorkoutGroupVM } from "@sendtally/features/statistics";
import { ExpandableRow } from "../../../components/ExpandableRow";
import { Icon } from "../../../components/Icon";
import { press, pressRow } from "../../../lib/press";
import { CategoryRow } from "../components/CategoryRow";
import { Label } from "../components/Label";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";

export type WorkoutsDoneProps = {
  groups: WorkoutGroupVM[];
  /** The training mix row narrowing the list, by name. */
  picked: string | null;
  onClear: () => void;
};

const openSession = (id: string): void =>
  router.push({ pathname: "/activity/[id]", params: { id } });

function Sessions({ row }: { row: WorkoutDoneVM }): React.ReactElement {
  return (
    <>
      {row.sessions.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => openSession(s.id)}
          accessibilityRole="button"
          accessibilityLabel={[s.dateLabel, s.duration, s.rpe].filter(Boolean).join(", ")}
          style={pressRow({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 })}
        >
          <Text style={[type.bodyBold, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
            {s.dateLabel}
          </Text>
          <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
            {s.duration}
          </Text>
          <Text
            style={[
              type.monoBold,
              { width: 48, textAlign: "right", fontSize: 12, color: colors.gunmetal },
            ]}
          >
            {s.rpe}
          </Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() =>
          router.navigate({
            pathname: "/(tabs)/sessions",
            params: { segment: "training", workout: row.key },
          })
        }
        accessibilityRole="link"
        hitSlop={8}
        style={press({
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          paddingVertical: 10,
        })}
      >
        <Label small color={colors.textSecondary}>
          {t("statistics.allInLog", { n: row.total })}
        </Label>
        <Icon name="chevron" color={colors.textSecondary} size={12} />
      </Pressable>
    </>
  );
}

/** Every workout done in range, grouped like the training mix, the most done first; one opens in place to its last sessions. */
export function WorkoutsDone({
  groups,
  picked,
  onClear,
}: WorkoutsDoneProps): React.ReactElement | null {
  const [open, setOpen] = React.useState<string | null>(null);
  if (groups.length === 0 && picked === null) return null;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 2,
        }}
      >
        <Label color={colors.gunmetal}>
          {picked === null
            ? t("statistics.workoutsMostDone")
            : t("statistics.workoutsOf", { name: picked })}
        </Label>
        {picked !== null && (
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={12} style={press({})}>
            <Label small color={colors.textSecondary}>
              {t("common.clear")}
            </Label>
          </Pressable>
        )}
      </View>
      {groups.length === 0 && (
        <Text style={[type.body, { paddingTop: 10, fontSize: 14, color: colors.textSecondary }]}>
          {t("statistics.noWorkoutsPicked", { name: picked ?? "" })}
        </Text>
      )}
      {groups.map((g) => (
        <View key={g.key}>
          <Label
            small
            color={g.kind === null ? colors.textSecondary : KIND_LOOK[g.kind].ink}
            style={{ paddingTop: 10, paddingBottom: 4 }}
          >
            {g.label}
          </Label>
          {g.rows.map((r) => {
            const id = `${g.key}:${r.key}`;
            const expanded = open === id;
            return (
              <ExpandableRow
                key={r.key}
                expanded={expanded}
                onToggle={() => setOpen(expanded ? null : id)}
                accessibilityLabel={`${r.name}, ${r.meta}`}
                indent={48}
                body={<Sessions row={r} />}
              >
                <View style={{ flex: 1 }}>
                  <CategoryRow
                    kind={r.kind}
                    name={r.name}
                    meta={r.meta}
                    showKind={g.kind === null}
                  />
                </View>
              </ExpandableRow>
            );
          })}
        </View>
      ))}
    </View>
  );
}
