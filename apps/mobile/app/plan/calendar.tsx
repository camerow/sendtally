import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { CalendarScreen } from "../../features/training/calendar/CalendarScreen";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";

export default function PlanCalendarRoute(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <HangDataProvider>
        <CalendarScreen />
      </HangDataProvider>
    </SafeAreaView>
  );
}
