#!/usr/bin/env bash
# Records the demo journey on an iOS simulator, one take per beat, into $OUT (default
# ~/Movies/sendtally-app-demo/takes). Needs the local API (`npx wrangler dev` in packages/api)
# and Metro (`EXPO_PUBLIC_E2E=true npx expo start --port $METRO_PORT` in apps/mobile) running,
# and a development build of the app (APP, or the newest one Xcode built). See README.md.
set -euo pipefail

cd "$(dirname "$0")"
here="$PWD"
device_name="sendtally-demo-video"
metro_port="${METRO_PORT:-8085}"
out="${OUT:-$HOME/Movies/sendtally-app-demo/takes}"
app="${APP:-$(ls -td "$HOME"/Library/Developer/Xcode/DerivedData/sendtally-*/Build/Products/Debug-iphonesimulator/sendtally.app 2>/dev/null | head -1)}"
if [ ! -d "$app" ]; then
  echo "no development build found; build one with npx expo run:ios or pass APP=" >&2
  exit 1
fi

udid="${SIM_UDID:-$(xcrun simctl list devices | grep -m1 "$device_name (" | grep -oE '[0-9A-F-]{36}' || true)}"
if [ -z "$udid" ]; then
  udid="$(xcrun simctl create "$device_name" "iPhone 17 Pro")"
fi
xcrun simctl boot "$udid" 2>/dev/null || true
xcrun simctl bootstatus "$udid" -b >/dev/null

xcrun simctl status_bar "$udid" override --time 9:41 --batteryState charged --batteryLevel 100 \
  --wifiBars 3 --cellularMode active --cellularBars 4

# A fresh install and an empty keychain, so every take starts signed out with nothing cached.
xcrun simctl uninstall "$udid" com.sendtally.app
xcrun simctl keychain "$udid" reset
xcrun simctl install "$udid" "$app"
xcrun simctl spawn "$udid" defaults write com.sendtally.app EXDevMenuShowFloatingActionButton -bool NO

node seed.mjs

# The trip covers the seeded outdoor days: five to three days ago.
trip_start="$(date -v-5d +%Y-%m-%d)"
trip_end_label="$(LC_ALL=en_US.UTF-8 date -v-3d '+%A, %B %-d')"

mkdir -p "$out"
maestro_env=(-e DEV_CLIENT=true -e METRO_PORT="$metro_port" -e TRIP_START="$trip_start" -e TRIP_END_LABEL="$trip_end_label")
maestro --device "$udid" test "${maestro_env[@]}" "$here/flows/sign-in.yaml"
# Maestro keeps each startRecording in its debug output, so point that at a scratch folder
# and lift the takes out of it.
debug="$(mktemp -d)"
maestro --device "$udid" test "${maestro_env[@]}" --debug-output "$debug" --flatten-debug-output \
  "$here/flows/journey.yaml"
find "$debug" -name '*.mp4' -exec cp {} "$out/" \;
rm -r "$debug"

ls -la "$out"
