import { jest } from "@jest/globals";
import type * as MockReact from "react";
import type * as MockReactNative from "react-native";

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));
// The library's mock answers useBottomSheetInternal everywhere; this one answers only inside a
// sheet, as the real library does, and keeps the sheet's own input a type of its own.
type MockSheet = new (...args: never[]) => MockReact.Component;
jest.mock("@gorhom/bottom-sheet", () => {
  const React = jest.requireActual<typeof MockReact>("react");
  const { TextInput } = jest.requireActual<typeof MockReactNative>("react-native");
  const mock = jest.requireActual<{
    BottomSheetModal: MockSheet;
    default: MockSheet;
    useBottomSheetInternal: () => object;
  }>("@gorhom/bottom-sheet/mock");
  const Inside = React.createContext(false);
  const insideSheet = (Base: MockSheet): MockSheet =>
    class extends Base {
      render(): MockReact.ReactNode {
        return React.createElement(Inside.Provider, { value: true }, super.render());
      }
    };
  return {
    ...mock,
    BottomSheetModal: insideSheet(mock.BottomSheetModal),
    default: insideSheet(mock.default),
    BottomSheetTextInput: function BottomSheetTextInput(
      props: MockReact.ComponentProps<typeof TextInput>
    ): MockReact.ReactElement {
      return React.createElement(TextInput, { testID: "bottom-sheet-text-input", ...props });
    },
    useBottomSheetInternal: () => (React.useContext(Inside) ? mock.useBottomSheetInternal() : null),
  };
});
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
