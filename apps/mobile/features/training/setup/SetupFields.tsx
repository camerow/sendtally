import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useHangData } from "../data/HangDataContext";
import { LoadField } from "../loads/LoadField";
import { type } from "../type";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { EdgeField } from "./EdgeField";

export type SetupFieldsProps = {
  kind: HangKind;
  setup: HangSetup;
  onChange: (setup: HangSetup) => void;
};

/** The edge a hang is on and the weight added to it, or a ground pull's weight. */
export function SetupFields({ kind, setup, onChange }: SetupFieldsProps): React.ReactElement {
  const { model } = useHangData();
  const { slot } = useFieldOrder(kind === "hang" ? ["edge", "load"] : ["load"]);
  const label = kind === "hang" ? t("hang.addedWeight") : t("hang.weight");
  return (
    <View style={{ gap: 20 }}>
      {kind === "hang" && (
        <EdgeField
          {...slot("edge")}
          edgeMm={setup.edgeMm}
          onChange={(edgeMm) => onChange({ ...setup, edgeMm })}
        />
      )}
      <LoadField
        {...slot("load")}
        kind={kind}
        kg={setup.loadKg}
        unit={model.settings.units}
        label={label}
        onChange={(loadKg) => onChange({ ...setup, loadKg })}
      >
        {kind === "hang" && (
          <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
            {t("hang.assistNote")}
          </Text>
        )}
      </LoadField>
    </View>
  );
}
