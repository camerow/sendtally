#!/usr/bin/env bash
# Get the branch's JavaScript onto the preview APK before the flows run, and prove it landed.
#
# This lives in a file rather than in the workflow because android-emulator-runner executes
# its `script` one line at a time through separate `sh -c` calls, so an `if` or a `for` in
# there dies on "end of file unexpected".
#
# UPDATE_ID is empty on the fallback path, where the APK was just built from this commit and
# carries the right JavaScript already.
set -euo pipefail

: "${UPDATE_ID:=}"
[ -n "$UPDATE_ID" ] || exit 0

APP=com.sendtally.app

# expo-updates reports nothing to download when it already holds the update, which is
# indistinguishable from an update that never arrived. A fresh emulator never holds one, but
# a local run repeating this does, so start from no app data either way.
adb shell pm clear "$APP"
adb logcat -c
adb shell monkey -p "$APP" -c android.intent.category.LAUNCHER 1

# `DownloadComplete` rather than the update id alone: the id appears seconds earlier at
# `CheckCompleteAvailable`, which is only the update being noticed, and force-stopping there
# kills the download about to start.
landed=false
for _ in $(seq 45); do
  if adb logcat -d | grep DownloadComplete | grep -q "$UPDATE_ID"; then
    landed=true
    break
  fi
  sleep 2
done

adb shell am force-stop "$APP"

if [ "$landed" != true ]; then
  echo "::error::The APK never downloaded update $UPDATE_ID, so the flows would have run against the JavaScript it was built with."
  adb logcat -d > ~/.maestro/logcat.txt
  exit 1
fi

# expo-updates launches the bundle it already had and applies the new one on the next start,
# so the flows get a second launch of their own.
echo "Update $UPDATE_ID downloaded; the flows will launch into it."
