import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AppStores } from "./AppStores";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

describe("AppStores", () => {
  let root: Root;
  let container: HTMLDivElement;
  const gtag = vi.fn();

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    gtag.mockReset();
  });

  it("reports a Google Ads conversion when a store badge is tapped", () => {
    act(() => root.render(<AppStores />));
    const badge = container.querySelector("a.l-store");
    badge?.addEventListener("click", (event) => event.preventDefault());
    act(() => (badge as HTMLAnchorElement).click());
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-18445754475/8C92CK_fpLcdEOvAz9tE",
      transport_type: "beacon",
    });
  });
});
