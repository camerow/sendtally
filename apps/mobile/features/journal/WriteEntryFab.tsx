import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press } from "../../lib/press";
import { NewEntrySheet } from "./NewEntrySheet";

/** Floats above Log a session: white, so the two never read as one button. */
export function WriteEntryFab(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={press({
          position: "absolute",
          right: 18,
          bottom: 78,
          flexDirection: "row",
          alignItems: "center",
          gap: 9,
          height: 44,
          paddingHorizontal: 20,
          borderRadius: 22,
          backgroundColor: colors.white,
          shadowColor: "#14131A",
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {t("journal.writeAnEntry")}
        </Text>
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <Icon name="chevron" size={12} strokeWidth={2.2} color={colors.gunmetal} />
        </View>
      </Pressable>
      <NewEntrySheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
