import { jest } from "@jest/globals";

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));
jest.mock("@gorhom/bottom-sheet", () => jest.requireActual("@gorhom/bottom-sheet/mock"));
