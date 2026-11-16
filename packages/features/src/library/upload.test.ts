import { afterEach, expect, it, vi } from "vitest";
import { SendtallyApi } from "@sendtally/api-client";

afterEach(() => vi.unstubAllGlobals());

it("lets fetch set the multipart type on a picture upload, and sends JSON as JSON", async () => {
  const sent: Request[] = [];
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    sent.push(new Request(input, init));
    return Promise.resolve(Response.json({ id: "m1" }));
  });
  const api = new SendtallyApi("https://api.test", () => Promise.resolve("token"));
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "p.jpg", { type: "image/jpeg" });

  await api.addLibraryPicture("workout", "max10", {
    picture: file,
    thumb: file,
    width: "1600",
    height: "1200",
  });
  await api.editLibraryMedia("m1", { alt: "A crimp" });

  expect(sent.map((r) => r.headers.get("content-type"))).toEqual([
    expect.stringMatching(/^multipart\/form-data; boundary=/),
    "application/json",
  ]);
  expect(sent[0]!.headers.get("authorization")).toBe("Bearer token");
});
