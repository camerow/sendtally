import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";

export type TitleFieldProps = { value: string; onChange: (title: string) => void };

export function TitleField({ value, onChange }: TitleFieldProps): React.ReactElement {
  return (
    <SheetSection label={t("plan.name")}>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={t("plan.name")}
        returnKeyType="done"
        maxLength={80}
        style={[
          type.bodyBold,
          {
            height: 48,
            paddingHorizontal: 14,
            borderRadius: 12,
            fontSize: 16,
            color: colors.gunmetal,
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
          },
        ]}
      />
    </SheetSection>
  );
}
