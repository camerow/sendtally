# Store listing

Copy for App Store Connect and Google Play Console, taken from the Sendtally Marketing Kit design canvas.
Character limits are in brackets.
Regenerate the images with `pnpm --filter @sendtally/mobile store:render`; they land in `store/out/`.

Metadata here is written for search, not just for reading.
Apple combines words across the app name, subtitle, and keyword field automatically, so no word appears in more than one of those three.
Google indexes the short and full descriptions instead, so the description carries the search terms in prose.

## Names and short copy

**App name** [30]

```
Sendtally: Climbing log
```

**Subtitle, iOS** [30]

```
Bouldering tracker & trends
```

**Title, Play** [30]

```
Sendtally: Climbing log
```

**Short description, Play** [80]

```
Log bouldering & climbing sessions: effort score, grade trends, Strava sync.
```

**Promotional text, iOS** [170]

```
Every session scored 1 to 10 against your own last eight weeks. One Strava activity per session, never doubled. Logging is free; membership adds the trends.
```

**Keywords, iOS** [100, comma separated]

```
boulder,gym,send,crag,route,grade,tracker,journal,workout,rpe,kilter,tension,moonboard,strava,belay
```

No spaces after the commas, and no word repeated from the app name or subtitle: Apple builds the phrases itself, so "climbing" in the name already pairs with "log", "gym", and "tracker" here.

`strava`, `kilter`, `tension`, and `moonboard` are other people's trademarks.
Apple sometimes rejects a keyword field carrying them, which costs a metadata resubmission rather than a binary one.
Submit the first release without those four, then add them in the following update once the app is approved.

**Category**

Primary: Health & Fitness.
Secondary: Sports.

## Description, both stores

```
sendtally is a session log for climbing and bouldering.

Log a bouldering session at the gym or a day at the crag in about a minute: date, times, grades in V-scale or Font, sends and attempts, tries, and a name for the climb if you want one. Every session gets an effort score from 1 to 10, measured against your own last eight weeks rather than a fixed scale, so a big night reads as a big night.

Turn on Strava and each session posts as one Rock Climbing activity with the climb log and effort score in the description. Sessions are fingerprinted, so a re-sync never posts twice.

This is a training journal, not a workout generator. sendtally records what you actually climbed, whether you boulder, climb ropes, or split the week between both, and shows you the shape of it over months.

Free, for everyone:
· Unlimited session logging, indoor and outdoor
· Bouldering and rope climbing, V-scale, Font, YDS or French
· Effort score on every session
· Strava sync
· Session history by month

Membership adds the trends:
· Climbing volume over time
· Grade pyramid
· Hardest send
· Flash rate
· Average grade

We never store your Strava password. Standard OAuth with activity-write scope only, revocable from Strava at any time. Delete your account and every session and token goes with it the same day.

Membership is a monthly subscription. Join in the app or on sendtally.com; either one unlocks the trends everywhere.
```

## What's new, first release

```
First release. Log sessions, get an effort score, sync to Strava.
```

## Assets

Screenshot order puts Strava second: only the first two are visible without swiping, and Strava is the strongest hook for a climber who already has the app.

| Asset                          | Size                | File                                                |
| ------------------------------ | ------------------- | --------------------------------------------------- |
| iOS screenshots, 6.9" and 6.7" | 1290x2796           | `out/ios/1-sessions.png` through `5-trends.png`     |
| iOS screenshots, 6.5"          | 1284x2778           | scale the 6.7" set                                  |
| Play phone screenshots         | 1080x1920           | `out/android/1-sessions.png` through `5-trends.png` |
| Play feature graphic           | 1024x500            | `out/feature-graphic.png`                           |
| Play icon                      | 512x512             | `out/play-icon-512.png`                             |
| iOS icon                       | 1024x1024, no alpha | `../assets/icon.png`, shipped in the build          |

Screenshot captions, in order: "Every session, in about a minute.", "Your climbing on Strava", "Log it right after you climb.", "See the whole night, climb by climb.", "Watch six months add up."

iPad screenshots are not needed: `supportsTablet` is false.

## Console setup beyond the copy

These are store-side and cost nothing, but none of them live in this repo.

- **Extra localizations.** Each one gets its own separately indexed keyword field. Add `en-GB` and `en-AU` on iOS first: same copy, and the second keyword field takes the terms that did not fit above (`training`, `climbing gym`, `logbook`, `hangboard`, `spray wall`). German, French, and Spanish next; climbing is large in all three.
- **Custom Product Pages, iOS.** 35 of them, each with its own URL, its own screenshots, and its own conversion analytics. Give every influencer partnership its own page so the installs are attributable. Play's equivalent is Custom Store Listings plus an install referrer.
- **In-App Events, iOS.** Indexed by App Store search, so they are another keyword surface as well as a merchandising one.
- **Ratings.** The app asks for a review after the fifth logged session (`apps/mobile/lib/review.ts`). Rating count and average move ranking harder than any copy change here.

## URLs

- Privacy policy: `https://sendtally.com/privacy`
- Support: `https://sendtally.com/support`
- Marketing: `https://sendtally.com`

## Play data safety

- Email address, collected for the account, tied to the user, not shared, deletable in app.
- App activity (logged sessions), tied to the user, not shared, deletable in app.
- Purchase history (Financial info), collected by the RevenueCat SDK to validate membership, tied to the user, not shared, deleted with the account.
- No advertising SDK.
- Data in transit is encrypted; account deletion is available in the app under Settings.

## App Review notes

Membership is an auto-renewing subscription sold in the app through the store's billing (one monthly product), and also on sendtally.com.
The trends screens are gated on it; the paywall on the Trends tab carries the price, the renewal terms, restore purchases, and the terms and privacy links.
Reviewers need the demo account so the trends screens in the screenshots are reachable without buying.
The demo account signs in with a password; every other account signs in with an emailed one-time code, which is why the form gets a username and password plus that one sentence under "Any other information required to access your app".
