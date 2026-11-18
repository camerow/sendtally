import { describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { setDraftOwner } from "../../lib/userDraftFile";
import { OwnerKnown } from "./OwnerKnown";

const mockAuth = { isLoaded: true, isSignedIn: true };
jest.mock("@clerk/clerk-expo", () => ({ useAuth: () => mockAuth }));
jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: T } = jest.requireActual<{ Text: typeof Text }>("react-native");
    return <T>{`redirect ${href}`}</T>;
  },
}));

const player = (
  <OwnerKnown>
    <Text>player</Text>
  </OwnerKnown>
);

describe("A live player before the account is known", () => {
  it("waits for the account its drafts belong to, so it never reads an empty store as a fresh run", async () => {
    setDraftOwner(null);
    await render(player);
    expect(screen.queryByText("player")).toBeNull();
    await act(async () => setDraftOwner("u1"));
    expect(screen.getByText("player")).toBeTruthy();
    await act(async () => setDraftOwner(null));
  });

  it("goes home when nobody is signed in, rather than waiting for an account that never comes", async () => {
    mockAuth.isSignedIn = false;
    setDraftOwner(null);
    await render(player);
    expect(screen.getByText("redirect /")).toBeTruthy();
    mockAuth.isSignedIn = true;
  });
});
