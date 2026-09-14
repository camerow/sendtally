import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { DELETE_CONFIRMATION_WORD, type DeleteAccountFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import {
  bodyText,
  dangerButton,
  dangerButtonLabel,
  messageText,
  sectionCard,
  sectionLabel,
  underlineLabel,
  underlinePress,
} from "../../lib/styles";

export type DeleteAccountSectionProps = {
  deletion: DeleteAccountFeature;
};

export function DeleteAccountSection({ deletion }: DeleteAccountSectionProps): React.ReactElement {
  const busy = deletion.status === "deleting" || deletion.status === "deleted";

  if (deletion.status === "idle") {
    return (
      <View style={{ gap: 8 }}>
        <Pressable
          onPress={deletion.open}
          accessibilityRole="button"
          style={press({ ...underlinePress, alignSelf: "flex-start" })}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              color: colors.watermelonInk,
              textDecorationLine: "underline",
            }}
          >
            {t("account.deleteAccount")}
          </Text>
        </Pressable>
        {deletion.error !== null && <Text style={messageText}>{deletion.error}</Text>}
      </View>
    );
  }

  return (
    <View style={{ ...sectionCard, gap: 12 }}>
      <Text style={sectionLabel}>{t("account.deleteAccount")}</Text>
      <Text style={bodyText}>{t("account.deleteBody")}</Text>
      <Text style={bodyText}>{t("account.typeToConfirm", { word: DELETE_CONFIRMATION_WORD })}</Text>
      <TextInput
        value={deletion.confirmation}
        onChangeText={deletion.setConfirmation}
        editable={!busy}
        autoCapitalize="characters"
        autoCorrect={false}
        style={{
          fontFamily: fonts.mono,
          fontSize: 14,
          color: colors.gunmetal,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.lineOnLight,
          borderRadius: radius.control,
          paddingHorizontal: 12,
          minHeight: 44,
        }}
      />
      <Pressable
        onPress={deletion.confirm}
        disabled={!deletion.canConfirm || busy}
        accessibilityRole="button"
        style={press({ ...dangerButton, opacity: !deletion.canConfirm || busy ? 0.5 : 1 })}
      >
        <Text style={dangerButtonLabel}>
          {busy ? t("common.deleting") : t("account.deleteMyAccount")}
        </Text>
      </Pressable>
      <Pressable
        onPress={deletion.cancel}
        disabled={busy}
        accessibilityRole="button"
        style={press(underlinePress)}
      >
        <Text style={{ ...underlineLabel, fontSize: 12 }}>{t("common.cancel")}</Text>
      </Pressable>
      {deletion.error !== null && <Text style={messageText}>{deletion.error}</Text>}
    </View>
  );
}
