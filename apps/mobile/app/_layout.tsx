import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { resourceCache } from "@clerk/clerk-expo/resource-cache";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { useFonts } from "expo-font";
import { getLocales } from "expo-localization";
import { Observe, ObserveInteractiveMarker, ObserveRoot } from "expo-observe";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@sendtally/design/tokens";
import { resolveLocale, setLocale } from "@sendtally/features/i18n";
import { OutboxProvider } from "@sendtally/features/outbox";
import { GradeScalesProvider } from "@sendtally/features/settings";
import { AnalyticsProvider } from "../features/analytics/AnalyticsProvider";
import { AlreadyRunningSheet } from "../features/live-session/AlreadyRunningSheet";
import { UpdateReadyOverlay } from "../features/app-update/UpdateReadyOverlay";
import { BillingProvider } from "../features/billing/BillingProvider";
import { useLiveHold } from "../features/training/hold/useLiveHold";
import { useRestTone } from "../features/training/rest/useRestTone";
import { ReminderPromptProvider } from "../features/training/reminders/ReminderPromptProvider";
import { CLERK_PUBLISHABLE_KEY } from "../lib/config";
import { outbox } from "../lib/api";
import { QueryProvider } from "../lib/QueryProvider";
import { useApi } from "../lib/api";
import { useFreshInstallUpdate } from "../features/app-update/useFreshInstallUpdate";
import { useUpdateCheckOnForeground } from "../features/app-update/useUpdateCheckOnForeground";

Observe.configure({ integrations: { "expo-router": true } });
setLocale(resolveLocale(getLocales()[0]?.languageTag));

const SIGNED_IN_SCREENS = [
  "session/new",
  "session/[fingerprint]",
  "session/[fingerprint]/edit",
  "journal/new",
  "journal/[id]",
  "journal/[id]/edit",
  "climb/[id]",
  "climb/log",
  "gym/[id]",
  "account",
  "profile",
  "membership",
  "workout/[id]",
  "workout/edit",
  "workout/category",
  "workout/checklist",
  "plan/schedule",
  "plan/block/[id]",
  "plan/ongoing",
  "plan/membership/[id]",
  "activity/new",
  "activity/[id]",
  "activity/[id]/edit",
  "exercise/[id]",
  "exercise/edit",
  "exercise/category",
  "grip/[id]",
  "grip/compare",
  "plan/calendar",
  "plan/day",
];

const LIVE_SCREENS = [
  "session/live",
  "workout/timer",
  "workout/intervals",
  "workout/sets",
  "workout/tally",
];

function InteractiveMarker(): React.ReactElement | null {
  const { isLoaded } = useAuth();
  return isLoaded ? <ObserveInteractiveMarker /> : null;
}

function AppStack(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  useRestTone();
  useLiveHold();
  const api = useApi();
  if (!isLoaded) return null;
  return (
    <GradeScalesProvider api={api}>
      <ReminderPromptProvider>
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}
        >
          <Stack.Protected guard={isSignedIn}>
            {SIGNED_IN_SCREENS.map((name) => (
              <Stack.Screen key={name} name={name} />
            ))}
            {LIVE_SCREENS.map((name) => (
              <Stack.Screen
                key={name}
                name={name}
                options={{ gestureEnabled: false, animation: "slide_from_bottom" }}
              />
            ))}
            <Stack.Screen
              name="workout/done"
              options={{ gestureEnabled: false, animation: "fade" }}
            />
          </Stack.Protected>
        </Stack>
        {isSignedIn && <AlreadyRunningSheet />}
        {isSignedIn && (
          <UpdateReadyOverlay hidden={LIVE_SCREENS.some((name) => pathname === `/${name}`)} />
        )}
      </ReminderPromptProvider>
    </GradeScalesProvider>
  );
}

function RootLayout(): React.ReactElement | null {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const updateSettled = useFreshInstallUpdate();
  useUpdateCheckOnForeground();
  if (!fontsLoaded || !updateSettled) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
        __experimental_resourceCache={resourceCache}
      >
        <QueryProvider>
          <OutboxProvider outbox={outbox}>
            <AnalyticsProvider>
              <BillingProvider>
                <BottomSheetModalProvider>
                  <InteractiveMarker />
                  <StatusBar style="dark" />
                  <AppStack />
                </BottomSheetModalProvider>
              </BillingProvider>
            </AnalyticsProvider>
          </OutboxProvider>
        </QueryProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

export default ObserveRoot.wrap(RootLayout);
