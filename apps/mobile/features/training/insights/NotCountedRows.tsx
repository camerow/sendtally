import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { WorkloadLeftOutVM } from "@sendtally/features/statistics";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";

function open({ ref, missing }: WorkloadLeftOutVM): void {
  if (ref.type === "activity") router.push({ pathname: "/activity/[id]", params: { id: ref.id } });
  else if (missing === "effort")
    router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: ref.id } });
  else
    router.push({
      pathname: "/session/[fingerprint]/edit",
      params: { fingerprint: ref.id, field: "duration" },
    });
}

/** Each record left out of the load, opening the field that would count it. */
export function NotCountedRows({
  label,
  rows,
  onOpen,
}: {
  label: string;
  rows: WorkloadLeftOutVM[];
  onOpen: () => void;
}): React.ReactElement {
  return (
    <>
      <Label color={colors.textSecondary} small>
        {label}
      </Label>
      {rows.map((l) => (
        <Pressable
          key={`${l.ref.type}${l.ref.id}`}
          accessibilityRole="button"
          onPress={() => {
            onOpen();
            open(l);
          }}
          style={pressRow({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          })}
        >
          <Text
            style={[type.body, { flex: 1, fontSize: 14.5, color: colors.gunmetal }]}
            numberOfLines={1}
          >
            {l.ref.name}
          </Text>
          <Text
            style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}
          >{`${l.detail} ›`}</Text>
        </Pressable>
      ))}
      <Text style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}>
        {t("statistics.workloadOpensRecord")}
      </Text>
    </>
  );
}
