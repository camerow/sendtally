import { useAuth } from "@clerk/clerk-expo";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/data/HangDataProvider";
import { ReminderPromptProvider } from "../../features/reminders/ReminderPromptProvider";
import { ReminderSync } from "../../features/reminders/ReminderSync";
import { useTheme } from "../../theme/ThemeContext";

function AppStack(): React.ReactElement {
  const c = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ground } }}>
      <Stack.Screen name="timer" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="done" options={{ gestureEnabled: false, animation: "fade" }} />
    </Stack>
  );
}

/**
 * Everything behind sign-in. The sheet host sits inside the data and theme
 * providers because a sheet renders at the host, not where it is declared,
 * and needs both.
 */
export default function SignedInLayout(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return (
    <HangDataProvider>
      <BottomSheetModalProvider>
        <ReminderPromptProvider>
          <ReminderSync />
          <AppStack />
        </ReminderPromptProvider>
      </BottomSheetModalProvider>
    </HangDataProvider>
  );
}
