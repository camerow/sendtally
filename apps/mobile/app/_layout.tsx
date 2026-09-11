import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
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
import { Observe, ObserveInteractiveMarker, ObserveRoot } from "expo-observe";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { colors } from "@sendtally/design/tokens";
import { AnalyticsProvider } from "../features/analytics/AnalyticsProvider";
import { BillingProvider } from "../features/billing/BillingProvider";
import { CLERK_PUBLISHABLE_KEY } from "../lib/config";

Observe.configure({ integrations: { "expo-router": true } });

function InteractiveMarker(): React.ReactElement | null {
  const { isLoaded } = useAuth();
  return isLoaded ? <ObserveInteractiveMarker /> : null;
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
  if (!fontsLoaded) return null;

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AnalyticsProvider>
        <BillingProvider>
          <InteractiveMarker />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.white },
            }}
          />
        </BillingProvider>
      </AnalyticsProvider>
    </ClerkProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
