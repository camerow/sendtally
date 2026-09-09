// Same reference Expo generates into expo-env.d.ts, kept in a file Expo does not
// own. `expo start` deletes and regenerates expo-env.d.ts as it runs, so a commit
// made with Metro running drops the file and `pnpm check-types` then fails on
// lib/config.ts with "Cannot find name 'process'".
/// <reference types="expo/types" />
