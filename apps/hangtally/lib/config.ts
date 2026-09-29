import { Platform } from "react-native";

const LOCAL_API_URL = Platform.OS === "android" ? "http://10.0.2.2:8787" : "http://localhost:8787";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? LOCAL_API_URL : "https://api.sendtally.com");

export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  (__DEV__
    ? "pk_test_bGlnaHQtbGlnZXItOTkuY2xlcmsuYWNjb3VudHMuZGV2JA"
    : "pk_live_Y2xlcmsuc2VuZHRhbGx5LmNvbSQ");
