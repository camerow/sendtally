import { jest } from "@jest/globals";

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));
jest.mock("@gorhom/bottom-sheet", () => jest.requireActual("@gorhom/bottom-sheet/mock"));
jest.mock("expo-notifications", () => ({
  setNotificationHandler: () => undefined,
  getPermissionsAsync: () => Promise.resolve({ granted: false }),
  cancelAllScheduledNotificationsAsync: () => Promise.resolve(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
// Importing the real Clerk SDK holds a handle open, so a lone test file's run never exits.
jest.mock("@clerk/clerk-expo", () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_test",
    getToken: () => Promise.resolve(null),
  }),
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: () => Promise.resolve() }),
}));
