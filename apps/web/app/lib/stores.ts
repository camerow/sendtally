export const APP_STORE_ID = "6810779919";

// An empty URL renders the badge as plain text instead of a link, so nothing
// points at a listing that is not live yet.
export const STORE_LINKS = {
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
  android: "https://play.google.com/store/apps/details?id=com.sendtally.app",
};

export type StorePlatform = "ios" | "android" | null;

// iPadOS Safari reports a Mac user agent, so an iPad sees both badges like a desktop does.
export function storePlatform(userAgent: string | null): StorePlatform {
  if (userAgent === null) return null;
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return null;
}
