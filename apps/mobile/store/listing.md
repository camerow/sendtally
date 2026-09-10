# Store listing

Copy for App Store Connect and Google Play Console, taken from the Sendtally Marketing Kit design canvas.
Character limits are in brackets.
Regenerate the images with `pnpm --filter @sendtally/mobile store:render`; they land in `store/out/`.

## Names and short copy

**App name** [30]

```
sendtally
```

**Subtitle, iOS** [30]

```
Climbing log with effort score
```

**Short description, Play** [80]

```
Log climbing sessions, see trends in your climbing, sync to Strava.
```

**Promotional text, iOS** [170]

```
Every session scored 1 to 10 against your own last eight weeks. One Strava activity per session, never doubled. Logging is free; membership adds the trends.
```

**Keywords, iOS** [100, comma separated]

```
climbing,bouldering,kilter,tension,moonboard,strava,training log,climbing log,rpe
```

**Category**

Primary: Health & Fitness.
Secondary: Sports.

## Description, both stores

```
sendtally is a session log for climbers.

Log a session in about a minute: date, times, grades in V-scale or Font, sends and attempts, tries, and a name for the climb if you want one. Every session gets an effort score from 1 to 10, measured against your own last eight weeks rather than a fixed scale, so a big night reads as a big night.

Turn on Strava and each session posts as one Rock Climbing activity with the climb log and effort score in the description. Sessions are fingerprinted, so a re-sync never posts twice.

Free, for everyone:
· Unlimited session logging
· Effort score on every session
· Strava sync
· Session history by month

Membership adds the trends:
· Volume over time
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

| Asset                          | Size                | File                                                |
| ------------------------------ | ------------------- | --------------------------------------------------- |
| iOS screenshots, 6.9" and 6.7" | 1290x2796           | `out/ios/1-sessions.png` through `5-strava.png`     |
| iOS screenshots, 6.5"          | 1284x2778           | scale the 6.7" set                                  |
| Play phone screenshots         | 1080x1920           | `out/android/1-sessions.png` through `5-strava.png` |
| Play feature graphic           | 1024x500            | `out/feature-graphic.png`                           |
| Play icon                      | 512x512             | `out/play-icon-512.png`                             |
| iOS icon                       | 1024x1024, no alpha | `../assets/icon.png`, shipped in the build          |

iPad screenshots are not needed: `supportsTablet` is false.

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
