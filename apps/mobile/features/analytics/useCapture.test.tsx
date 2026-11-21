import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type React from "react";
import type { Capture } from "@sendtally/features/settings";
import { ProvideCapture } from "./AnalyticsProvider";
import { useCapture } from "./useCapture";

const mockPosthogCapture = jest.fn<(event: string, properties?: object) => void>();

jest.mock("posthog-react-native", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
  usePostHog: () => ({ capture: mockPosthogCapture }),
}));
jest.mock("../../lib/config", () => ({ IS_E2E: false, POSTHOG_API_KEY: "", POSTHOG_HOST: "" }));

const grab = async (
  wrapper?: React.ComponentType<{ children: React.ReactNode }>
): Promise<Capture> =>
  (await renderHook(() => useCapture(), wrapper === undefined ? {} : { wrapper })).result.current;

const resumed = { path: "plan", at: "P3" } as const;

describe("useCapture", () => {
  it("is a silent no-op with no PostHog client, as in a build without a key or an E2E run", async () => {
    const capture = await grab();
    expect(() => capture("onboarding_resumed", resumed)).not.toThrow();
    expect(mockPosthogCapture).not.toHaveBeenCalled();
  });

  it("sends through the client when there is one", async () => {
    const capture = await grab(ProvideCapture);
    capture("onboarding_resumed", resumed);
    expect(mockPosthogCapture).toHaveBeenCalledWith("onboarding_resumed", resumed);
  });

  it("never throws into the wizard when the client does", async () => {
    mockPosthogCapture.mockImplementationOnce(() => {
      throw new Error("queue full");
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const capture = await grab(ProvideCapture);
    expect(() => capture("onboarding_resumed", resumed)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
