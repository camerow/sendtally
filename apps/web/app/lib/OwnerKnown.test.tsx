import { afterEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { OwnerKnown } from "./OwnerKnown";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const auth = vi.hoisted(() => ({
  isLoaded: false,
  userId: undefined as string | null | undefined,
}));
vi.mock("@clerk/react-router", () => ({ useAuth: () => auth }));
vi.mock("react-router", () => ({
  Navigate: ({ to }: { to: string }) => <span>{`redirect ${to}`}</span>,
}));

const show = (): string => {
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <OwnerKnown>
        <span>player</span>
      </OwnerKnown>
    )
  );
  const text = container.textContent ?? "";
  act(() => root.unmount());
  return text;
};

afterEach(() => {
  auth.isLoaded = false;
  auth.userId = undefined;
});

describe("A live player before the account is known", () => {
  it("waits for Clerk's user, so it never reads an empty store as a fresh run", () => {
    expect(show()).toBe("");
    Object.assign(auth, { isLoaded: true, userId: "u1" });
    expect(show()).toBe("player");
  });

  it("goes to sign in when nobody is signed in, rather than waiting for a user that never comes", () => {
    Object.assign(auth, { isLoaded: true, userId: null });
    expect(show()).toBe("redirect /sign-in");
  });
});
