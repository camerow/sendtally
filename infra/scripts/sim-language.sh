#!/usr/bin/env sh
# Switch an iOS simulator language for a localization check, or reset it.
#
#   sim-language.sh de            language de, locale de_DE
#   sim-language.sh fr fr_CA      explicit locale
#   sim-language.sh reset         back to the host default
#
# Targets the booted simulator, or SIM_UDID when set. The simulator reboots
# so the setting applies; relaunch the app afterwards.
set -eu

lang=${1:?usage: sim-language.sh <lang|reset> [locale]}
locale=${2:-"${lang}_$(echo "$lang" | tr "[:lower:]" "[:upper:]")"}
udid=${SIM_UDID:-$(xcrun simctl list devices booted -j | sed -n "s/.*\"udid\" : \"\([^\"]*\)\".*/\1/p" | head -1)}
[ -n "$udid" ] || { echo "sim-language: no booted simulator; set SIM_UDID" >&2; exit 1; }

prefs() { xcrun simctl spawn "$udid" defaults "$@"; }
if [ "$lang" = reset ]; then
  prefs delete .GlobalPreferences AppleLanguages 2>/dev/null || true
  prefs delete .GlobalPreferences AppleLocale 2>/dev/null || true
else
  prefs write .GlobalPreferences AppleLanguages -array "$lang"
  prefs write .GlobalPreferences AppleLocale "$locale"
fi
xcrun simctl shutdown "$udid"
xcrun simctl boot "$udid"
echo "sim-language: $udid -> $lang"
