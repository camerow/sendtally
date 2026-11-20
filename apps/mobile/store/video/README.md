# App demo video

Marketing cuts of the real app for the Google Ads Performance Max asset group and social.
The journey is five beats: build a training block, group climbs under a trip, tally a live gym session, run a hangboard timer, and end on Stats.
Each beat is recorded from the iOS simulator by a Maestro flow, so a take can be re-shot whenever the UI changes.

## Files

- `seed.mjs` resets the demo account (`demo+clerk_test@sendtally.com` on the Clerk development instance) in the local D1 and seeds ten weeks of gym sessions, three outdoor days for the trip, and three Max hangs sessions with a rising load.
- `flows/` holds one Maestro flow per beat; each starts and stops its own recording, and `journey.yaml` runs them in order.
- `capture.sh` reinstalls the app on the `sendtally-demo-video` simulator, sets the status bar to 9:41 with a full battery, seeds, signs in, and records the beats into `~/Movies/sendtally-app-demo/takes`.
- `edit.mjs` composites the takes into the brand frame and writes the cuts and a contact sheet next to the takes folder.

## Re-rendering

1. Start the local API from `packages/api`: `npx wrangler d1 migrations apply DB --local && npx wrangler dev`.
2. Start Metro from `apps/mobile`: `EXPO_PUBLIC_E2E=true npx expo start --port 8085`.
3. Have a development build of the app (`npx expo run:ios`, see `docs/mobile-e2e.md`); `capture.sh` installs the newest one in DerivedData, or `APP=/path/to/sendtally.app`.
4. From `apps/mobile`: `store/video/capture.sh`.
5. Check the takes, then from `apps/mobile`: `node store/video/edit.mjs`.

Maestro needs a Java runtime; Android Studio's works (`export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`).
On a shared machine, take `~/.sendtally-sim-lock` first, since only one simulator runs at a time.

## Outputs

| File                             | Size      | Use                                |
| -------------------------------- | --------- | ---------------------------------- |
| `sendtally-demo-16x9.mp4`        | 1920x1080 | Performance Max, YouTube in-stream |
| `sendtally-demo-1x1.mp4`         | 1080x1080 | Performance Max, feeds             |
| `sendtally-demo-9x16.mp4`        | 1080x1920 | Performance Max, Stories, Reels    |
| `sendtally-demo-shorts-9x16.mp4` | 1080x1920 | YouTube Shorts, under 60 seconds   |
| `contact-sheet.jpg`              | -         | Stills from every cut for review   |

All cuts are H.264 MP4 at 30 fps with a silent AAC track, and every caption sits inside the centre 80% of the frame.
Beat windows, holds and playback speed live in `BEATS` at the top of `edit.mjs`; the captions are there too.
The binaries stay out of git.
