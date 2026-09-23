import { expect, test } from "@jest/globals";
import { webLinkToRoute } from "./webLink";

test.each([
  ["https://sendtally.com/app", "/"],
  ["https://sendtally.com/app/sessions/manual-abc", "/session/manual-abc"],
  ["https://sendtally.com/app/sessions/manual-abc/edit?x=1", "/session/manual-abc/edit"],
  ["https://sendtally.com/app/sessions/new", "/session/new"],
  ["https://sendtally.com/app/projects", "/(tabs)/projects"],
  ["https://sendtally.com/app/projects/the-slug/", "/project/the-slug"],
  ["https://sendtally.com/app/trends/days", "/trend/days"],
  ["https://sendtally.com/app/settings/gyms/7", "/gym/7"],
  ["https://sendtally.com/app/journal/12/edit", "/journal/12/edit"],
  ["https://sendtally.com/app/journal", "/"],
  ["/app/membership", "/membership"],
  ["https://sendtally.com/app/import", "/"],
  ["sendtally://sso-callback?code=1", "sendtally://sso-callback?code=1"],
  ["sendtally://app/sessions/x", "sendtally://app/sessions/x"],
  ["/connected/strava", "/connected/strava"],
])("%s -> %s", (link, route) => {
  expect(webLinkToRoute(link)).toBe(route);
});
