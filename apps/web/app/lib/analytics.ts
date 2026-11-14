type Properties = Record<string, string | number | boolean | undefined>;

type PostHogClient = {
  identify: (distinctId: string, properties?: Properties) => void;
  capture: (event: string, properties?: Properties) => void;
  reset: () => void;
};

// The loader snippet installs a stub that queues calls until array.js lands,
// so callers never have to wait for it - they only have to survive SSR and a
// blocked script.
function client(): PostHogClient | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { posthog?: PostHogClient }).posthog ?? null;
}

export function capture(event: string, properties?: Properties): void {
  client()?.capture(event, properties);
}

export function identify(distinctId: string, properties?: Properties): void {
  client()?.identify(distinctId, properties);
}

export function resetIdentity(): void {
  client()?.reset();
}

type Gtag = (...args: unknown[]) => void;

const ADS_CONVERSIONS = {
  storeClick: "AW-18445754475/8C92CK_fpLcdEOvAz9tE",
  signUp: "AW-18445754475/rAZcCKzfpLcdEOvAz9tE",
} as const;

// The Google tag only loads in production, so this is a no-op everywhere else.
export function adsConversion(name: keyof typeof ADS_CONVERSIONS): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", "conversion", { send_to: ADS_CONVERSIONS[name], transport_type: "beacon" });
}
