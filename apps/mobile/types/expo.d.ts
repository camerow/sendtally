// Expo's ambient types, including the `process.env` shape the EXPO_PUBLIC_*
// reads in lib/config.ts depend on.
//
// The Expo CLI writes the same reference into expo-env.d.ts, but it owns that
// file and deletes it on `expo start` while typedRoutes is off. Keeping our own
// copy means running the dev server can no longer break `pnpm check-types`.
/// <reference types="expo/types" />
