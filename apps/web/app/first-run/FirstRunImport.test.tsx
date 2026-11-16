import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import { FirstRunImport } from "./FirstRunImport";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe("import from first run", () => {
  it("sits in first run's frame, with Skip for now on to the days and Back to the question", () => {
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <FirstRunImport api={{} as SendtallyApi} from="theCrag" />
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    const links = [...host.querySelectorAll("a")].map((a) => [
      a.textContent,
      a.getAttribute("href"),
    ]);
    expect(links).toContainEqual(["Skip for now", "/app/start?later=1"]);
    expect(links).toContainEqual(["Your old log", "/app/start"]);
    expect(host.textContent).toContain("Open thecrag.com");
  });
});
