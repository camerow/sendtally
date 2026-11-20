import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { WithWeightUnit } from "./WithWeightUnit";

let mockState: object = { status: "loading" };
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/query", () => ({
  queries: { hang: () => ({}) },
  useQuery: () => ({ state: mockState, reload: () => Promise.resolve() }),
}));

describe("WithWeightUnit", () => {
  beforeEach(() => {
    mockState = { status: "loading" };
  });

  it("shows no weight field until the unit has loaded, so nothing is typed or saved in a guessed unit", async () => {
    await render(<WithWeightUnit>{(unit) => <Text>{`field in ${unit}`}</Text>}</WithWeightUnit>);
    expect(screen.queryByText(/field in/)).toBeNull();
  });

  it("hands the user's own unit to the screen once it has", async () => {
    mockState = { status: "ready", data: { settings: { units: "kg" } } };
    await render(<WithWeightUnit>{(unit) => <Text>{`field in ${unit}`}</Text>}</WithWeightUnit>);
    expect(screen.getByText("field in kg")).toBeTruthy();
  });
});
