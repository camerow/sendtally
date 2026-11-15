import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import type { ImportSource } from "@sendtally/features/import";
import { ImportFlow } from "./ImportFlow";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;
const api = { tags: async () => ({ tags: [] }) } as unknown as SendtallyApi;

const render = (props: { then?: string; from?: ImportSource }): void =>
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ImportFlow api={api} {...props} />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
const text = (): string => host.textContent ?? "";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe("import on the web", () => {
  it("opened from first run, shows the picked source's steps and site in place of every app's", () => {
    render({ then: "/app/start", from: "mountainProject" });
    expect(text()).toContain("Select “Export CSV” to download the file.");
    expect(text()).toContain("Open mountainproject.com");
    expect(text()).not.toContain("Where to export");
    expect(text()).not.toContain("Exports from these apps");
    expect(host.querySelector("input[type=file]")?.getAttribute("accept")).toBe(
      ".csv,text/csv,text/comma-separated-values,text/plain"
    );
  });

  it("opened from Settings, lists every app's export and has no Skip for now", () => {
    render({});
    expect(text()).toContain("Where to export");
    expect(text()).not.toContain("Skip for now");
  });
});
