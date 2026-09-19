import { Platform } from "react-native";

const LOCAL_API_URL = Platform.OS === "android" ? "http://10.0.2.2:8787" : "http://localhost:8787";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? LOCAL_API_URL : "https://api.sendtally.com");

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  (__DEV__
    ? "pk_test_bGlnaHQtbGlnZXItOTkuY2xlcmsuYWNjb3VudHMuZGV2JA"
    : "pk_live_Y2xlcmsuc2VuZHRhbGx5LmNvbSQ");

export const REVENUECAT_API_KEY =
  Platform.select({
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "goog_TsTamyxqBbukzZbEAUieLNrZABL",
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "appl_IlzSBshbPLcWxzBbHZkHCdJoeOn",
  }) ?? "";

export const WEB_URL = "https://sendtally.com";

export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";

export const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const IS_E2E = process.env.EXPO_PUBLIC_E2E === "true";
