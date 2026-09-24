import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
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
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@sendtally/design/tokens";
import { resolveLocale, setLocale } from "@sendtally/features/i18n";
import { AnalyticsProvider } from "../features/analytics/AnalyticsProvider";
import { BillingProvider } from "../features/billing/BillingProvider";
import { LogBox } from "react-native";
import { CLERK_PUBLISHABLE_KEY, IS_E2E } from "../lib/config";
import { QueryProvider } from "../lib/QueryProvider";
import { useFreshInstallUpdate } from "../features/app-update/useFreshInstallUpdate";
import { useUpdateCheckOnForeground } from "../features/app-update/useUpdateCheckOnForeground";

// RevenueCat logs an error on every emulator without Play billing, and a dev build's LogBox
// popup for it covers the screen a flow is driving.
if (IS_E2E) LogBox.ignoreAllLogs();
Observe.configure({ integrations: { "expo-router": true } });
setLocale(resolveLocale(getLocales()[0]?.languageTag));

const SIGNED_IN_SCREENS = [
  "session/new",
  "session/[fingerprint]",
  "session/[fingerprint]/edit",
  "journal/new",
  "journal/[id]",
  "journal/[id]/edit",
  "project/[slug]",
  "trend/[page]",
  "gym/[id]",
  "account",
  "membership",
];

function InteractiveMarker(): React.ReactElement | null {
  const { isLoaded } = useAuth();
  return isLoaded ? <ObserveInteractiveMarker /> : null;
}

function AppStack(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
      <Stack.Protected guard={isSignedIn}>
        {SIGNED_IN_SCREENS.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack.Protected>
    </Stack>
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
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <QueryProvider>
          <AnalyticsProvider>
            <BillingProvider>
              <BottomSheetModalProvider>
                <InteractiveMarker />
                <StatusBar style="dark" />
                <AppStack />
              </BottomSheetModalProvider>
            </BillingProvider>
          </AnalyticsProvider>
        </QueryProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

export default ObserveRoot.wrap(RootLayout);
