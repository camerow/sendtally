import { useClerk, useUser } from "@clerk/clerk-expo";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Text, View } from "react-native";
import { DELETE_CONFIRMATION_WORD, useDeleteAccount } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { SheetSection } from "../../components/SheetSection";
import { useApi } from "../../lib/api";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

/** Who is signed in, sign out, and account deletion with a typed confirmation. */
export function AccountSetting(): React.ReactElement {
  const c = useTheme();
  const api = useApi();
  const { signOut } = useClerk();
  const { user } = useUser();
  const deletion = useDeleteAccount(api, () => void signOut());
  const body = [type.body, { fontSize: 13, lineHeight: 19, color: c.ink2 }];

  return (
    <SheetSection label={t("common.account")}>
      <Text style={[type.body, { fontSize: 15, color: c.ink }]}>
        {`${t("account.signedInAs")} ${user?.primaryEmailAddress?.emailAddress ?? ""}`}
      </Text>
      {deletion.status === "idle" ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label={t("common.signOut")}
            onPress={() => void signOut()}
            variant="outlineLight"
          />
          <Button
            label={t("account.deleteAccount")}
            onPress={deletion.open}
            variant="outlineLight"
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={body}>{t("account.deleteBody")}</Text>
          <Text style={body}>{t("account.typeToConfirm", { word: DELETE_CONFIRMATION_WORD })}</Text>
          <BottomSheetTextInput
            value={deletion.confirmation}
            onChangeText={deletion.setConfirmation}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel={t("account.typeToConfirm", { word: DELETE_CONFIRMATION_WORD })}
            style={[
              type.mono,
              {
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 16,
                color: c.ink,
                backgroundColor: c.soft,
                borderWidth: 1,
                borderColor: c.lineLight,
              },
            ]}
          />
          {deletion.error !== null && <Text style={body}>{deletion.error}</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button label={t("hang.cancel")} onPress={deletion.cancel} variant="outlineLight" />
            <Button
              label={t("account.deleteMyAccount")}
              onPress={deletion.confirm}
              variant="ink"
              disabled={!deletion.canConfirm || deletion.status === "deleting"}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </SheetSection>
  );
}
