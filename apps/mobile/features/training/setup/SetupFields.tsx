import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { useHangData } from "../data/HangDataContext";
import { loadControl } from "../loads/loadControl";
import { type } from "../type";
import { EdgeField } from "./EdgeField";

export type SetupFieldsProps = {
  kind: HangKind;
  setup: HangSetup;
  onChange: (setup: HangSetup) => void;
};

/** The edge a hang is on and the weight added to it, or a ground pull's weight. */
export function SetupFields({ kind, setup, onChange }: SetupFieldsProps): React.ReactElement {
  const { model } = useHangData();
  const load = loadControl(kind, setup.loadKg, model.settings.units, (loadKg) =>
    onChange({ ...setup, loadKg })
  );
  const label = kind === "hang" ? t("hang.addedWeight") : t("hang.weight");
  return (
    <View style={{ gap: 20 }}>
      {kind === "hang" && (
        <EdgeField edgeMm={setup.edgeMm} onChange={(edgeMm) => onChange({ ...setup, edgeMm })} />
      )}
      <SheetSection label={label}>
        <Stepper
          value={load.text}
          onCommit={load.commit}
          onStep={load.step}
          label={label}
          decreaseLabel={t("hang.lessWeight")}
          increaseLabel={t("hang.moreWeight")}
          surface="plain"
          keyboard="numbers-and-punctuation"
        />
        {kind === "hang" && (
          <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
            {t("hang.assistNote")}
          </Text>
        )}
      </SheetSection>
    </View>
  );
}
