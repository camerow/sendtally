import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { bodyText } from "../../lib/styles";

export type TrainingPlaceholderProps = {
  title: string;
  body: string;
};

export function TrainingPlaceholder({ title, body }: TrainingPlaceholderProps): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={title} right={<AccountButton />} />
      <View style={{ alignItems: "center", paddingHorizontal: 28, paddingTop: 44 }}>
        <Text style={{ ...bodyText, textAlign: "center" }}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}
