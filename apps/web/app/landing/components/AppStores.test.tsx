import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AppStores } from "./AppStores";
import { LandingProvider } from "../LandingContext";
import { STORE_LINKS, type StorePlatform } from "../../lib/stores";

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

  it.each([
    ["ios", [STORE_LINKS.ios]],
    ["android", [STORE_LINKS.android]],
    [null, [STORE_LINKS.android, STORE_LINKS.ios]],
  ] as const)(
    "shows the %s visitor only the badges for their phone",
    (platform: StorePlatform, links) => {
      act(() =>
        root.render(
          <LandingProvider signedIn={false} locale="en" platform={platform}>
            <AppStores />
          </LandingProvider>
        )
      );
      const hrefs = [...container.querySelectorAll("a.l-store")].map((a) => a.getAttribute("href"));
      expect(hrefs).toEqual(links);
    }
  );
});
