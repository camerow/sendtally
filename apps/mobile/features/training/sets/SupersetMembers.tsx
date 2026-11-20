import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { TargetText } from "@sendtally/features/workouts";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";

export type SupersetMember = {
  letter: string;
  name: string;
  /** A round's target: `targetText(dose, kind, unit, { round: true })`. */
  target: TargetText;
  onHistory?: () => void;
};

export type SupersetMembersProps = { members: readonly SupersetMember[] };

/** A superset's exercises, said once: letter, name over its target, and its History. */
export function SupersetMembers({ members }: SupersetMembersProps): React.ReactElement {
  return (
    <View>
      {members.map((m) => (
        <View
          key={m.letter}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5 }}
        >
          <Text
            style={[
              type.mono,
              SET_COLUMNS.position,
              { alignSelf: "flex-start", paddingTop: 3, fontSize: 12, color: colors.textMuted },
            ]}
          >
            {m.letter}
          </Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{m.name}</Text>
            <Text style={[type.monoBold, { fontSize: 13, lineHeight: 19, color: colors.gunmetal }]}>
              {[m.target.work, m.target.rpe].filter((l) => l !== undefined && l !== "").join(" · ")}
            </Text>
          </View>
          {m.onHistory !== undefined && (
            <View style={{ margin: -8, marginLeft: 0 }}>
              <IconButton
                icon="history"
                label={t("common.historyOf", { name: m.name })}
                onPress={m.onHistory}
                color={colors.gunmetal}
                size={40}
                iconSize={20}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
