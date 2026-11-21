import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, NetworkError, SendtallyApi } from "@sendtally/api-client";
import { t } from "../i18n";
import { errorMessage } from "./errorMessage";

const api = new SendtallyApi("https://api.test", () => Promise.resolve("token"));

const failingWith = async (rejection: unknown, signal?: AbortSignal): Promise<unknown> => {
  vi.stubGlobal("fetch", () => Promise.reject(rejection));
  const file = new File([new Uint8Array([0xff])], "p.jpg", { type: "image/jpeg" });
  const picture = { picture: file, thumb: file, width: "1", height: "1" };
  return api.addLibraryPicture("workout", "max10", picture, signal).catch((e: unknown) => e);
};

afterEach(() => vi.unstubAllGlobals());

describe("errorMessage", () => {
  it("says sendtally could not be reached when the request never got an answer, whatever the runtime threw", async () => {
    const native = new Error(
      "fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)"
    );
    for (const rejection of [native, new TypeError("Failed to fetch"), "offline"]) {
      const error = await failingWith(rejection);
      expect(error).toBeInstanceOf(NetworkError);
      expect(errorMessage(error)).toBe(t("common.unreachable"));
    }
  });

  it("leaves a request the screen cancelled as the cancellation it was", async () => {
    const cancelled = new DOMException("Aborted", "AbortError");
    const controller = new AbortController();
    controller.abort();
    expect(await failingWith(cancelled, controller.signal)).toBe(cancelled);
  });

  it("keeps what the server said, and falls back when an error says nothing", () => {
    expect(errorMessage(new ApiError(409, "that name is taken"))).toBe("that name is taken");
    expect(errorMessage(new Error(""))).toBe(t("common.somethingWentWrong"));
    expect(errorMessage(null)).toBe(t("common.somethingWentWrong"));
  });
});
