import React from "react";
import { Text, View } from "react-native";
import { SKIP_REASONS, type SkipReason } from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { plannedOn, type Occurrence } from "@sendtally/features/training";
import { Chip } from "../../../components/Chip";
import { TextInput } from "../../../components/TextInput";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { SheetHeader } from "../components/SheetHeader";
import { HangSheet } from "../data/HangSheet";
import { usePlanActions } from "../plan/usePlanActions";
import { type } from "../type";

export type SkipSheetProps = { occurrence: Occurrence; name: string; onClose: () => void };

/** Skips one planned run, with why if the user says: it counts as neither done nor missed. */
export function SkipSheet({ occurrence: o, name, onClose }: SkipSheetProps): React.ReactElement {
  const actions = usePlanActions();
  const [reason, setReason] = React.useState<SkipReason | null>(null);
  const [note, setNote] = React.useState("");
  return (
    <HangSheet visible onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <SheetHeader
          kicker={name}
          title={t("plan.skipTitle")}
          action={t("common.cancel")}
          onAction={onClose}
        />
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
          {t("plan.skipBody")}
        </Text>
        <View style={{ gap: 8 }}>
          <Label color={colors.textSecondary}>{t("plan.skipWhy")}</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {SKIP_REASONS.map((r) => (
              <Chip
                key={r}
                label={t(`plan.reason_${r}`)}
                uppercase={false}
                active={reason === r}
                onPress={() => setReason(reason === r ? null : r)}
              />
            ))}
          </View>
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t("plan.skipNote")}
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={t("plan.skipNote")}
          maxLength={280}
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors.gunmetal,
            borderWidth: 1,
            borderColor: "rgba(64,63,76,0.15)",
            borderRadius: radius.control,
            paddingHorizontal: 13,
            paddingVertical: 12,
          }}
        />
        <Button
          label={t("plan.skip")}
          onPress={() => {
            void actions.savePlanChange({
              membershipId: o.membership.id,
              plannedOn: plannedOn(o),
              kind: "skip",
              movedTo: null,
              reason,
              note: note.trim() === "" ? null : note.trim(),
            });
            onClose();
          }}
          variant="primary"
          height={54}
        />
      </View>
    </HangSheet>
  );
}
