import { Platform } from "react-native";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.sendtally.com";

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_live_Y2xlcmsuc2VuZHRhbGx5LmNvbSQ";

export const REVENUECAT_API_KEY =
  Platform.select({
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  }) ?? "";

export const WEB_URL = "https://sendtally.com";

export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";

export const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
