import { jest } from "@jest/globals";
import { timeoutManager } from "@tanstack/react-query";
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
        return React.createElement(Inside.Provider, { value: true, children: super.render() });
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
// Players and timers play their tones through one stable player that makes no sound.
const mockPlayer = { seekTo: () => Promise.resolve(), play: () => undefined };
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockPlayer,
  setAudioModeAsync: () => Promise.resolve(),
}));
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
// A query unmounted waits out its gcTime, five minutes for a climb search, before it goes; a
// timer that long kept a lone test file's run open. Unreferenced, it still fires but holds nothing.
type Unreferenced = { unref?: () => void };
timeoutManager.setTimeoutProvider({
  setTimeout: (callback, delay) => {
    const id = setTimeout(callback, delay);
    (id as Unreferenced).unref?.();
    return id;
  },
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (callback, delay) => setInterval(callback, delay),
  clearInterval: (id) => clearInterval(id),
});
