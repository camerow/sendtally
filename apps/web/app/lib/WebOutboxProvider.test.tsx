import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApiError, type SendtallyApi } from "@sendtally/api-client";
import { useLocalWrite, type LocalWrite } from "@sendtally/features/outbox";
import { ToastProvider } from "../components/Toast";
import { WebOutboxProvider } from "./WebOutboxProvider";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let write: LocalWrite;

function Capture(): null {
  const local = useLocalWrite();
  React.useEffect(() => {
    write = local;
  }, [local]);
  return null;
}

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(exportCsv: () => Promise<string>): void {
  const api = { exportCsv } as unknown as SendtallyApi;
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <WebOutboxProvider api={api} userId="user_1">
            <Capture />
          </WebOutboxProvider>
        </ToastProvider>
      </QueryClientProvider>
    )
  );
}

const send = (): Promise<void> =>
  act(async () => {
    write({ key: "csv", method: "exportCsv", args: [] });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("WebOutboxProvider", () => {
  it("keeps a write under the signed-in user until the server has it", async () => {
    let finish: (value: string) => void = () => {};
    const exportCsv = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)));
    mount(exportCsv);
    await send();
    expect(exportCsv).toHaveBeenCalledOnce();
    expect(localStorage.getItem("sendtally:outbox:user_1")).toContain("exportCsv");
    await act(async () => {
      finish("");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(localStorage.getItem("sendtally:outbox:user_1")).toBeNull();
  });

  it("says so when the server refuses a write", async () => {
    mount(() => Promise.reject(new ApiError(422, "no")));
    await send();
    expect(container.querySelector(".toast")?.textContent).toBe(
      "A change could not be saved, so it was undone."
    );
  });
});
