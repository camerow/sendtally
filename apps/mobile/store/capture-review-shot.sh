#!/usr/bin/env bash
# Captures store/out/ios/iap-review-shot.png from the running app on an iPhone 6.7" simulator
# (1290x2796, e.g. iPhone 15 Pro Max). Needs the local API and Metro up; see docs/mobile-e2e.md.
set -euo pipefail

cd "$(dirname "$0")/.."
udid="${SIM_UDID:-$(xcrun simctl list devices booted | grep -m1 -oE '[0-9A-F-]{36}')}"
out="store/out/ios/iap-review-shot.png"

xcrun simctl status_bar "$udid" override --time 9:41 --batteryState charged --batteryLevel 100 \
  --wifiBars 3 --cellularMode active --cellularBars 4
xcrun simctl spawn "$udid" defaults write com.sendtally.app EXDevMenuShowFloatingActionButton -bool NO

maestro --device "$udid" test -e DEV_CLIENT=true maestro/store/iap-review-shot.yaml
mkdir -p "$(dirname "$out")"
xcrun simctl io "$udid" screenshot "$out"
sips -g pixelWidth -g pixelHeight "$out" | tail -2
