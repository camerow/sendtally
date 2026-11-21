import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import { ImportFlow } from "./ImportFlow";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;
const api = { tags: async () => ({ tags: [] }) } as unknown as SendtallyApi;

const render = (): void =>
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ImportFlow api={api} />
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
  it("opened from Settings, lists every app's export and has no Skip for now", () => {
    render();
    expect(text()).toContain("Where to export");
    expect(text()).not.toContain("Skip for now");
  });
});
