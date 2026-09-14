#!/usr/bin/env sh
# Switch an iOS simulator's language for a localization check, or reset it.
#
#   sim-language.sh de            language de, locale de_DE
#   sim-language.sh fr fr_CA      explicit locale
#   sim-language.sh reset         back to the host default
#
# The device comes from SIM_UDID or the second positional form
# `sim-language.sh <lang> --udid <udid>`; without either the booted one is used.
# The simulator reboots so the setting applies; relaunch the app afterwards.
set -eu

lang=${1:?usage: sim-language.sh <lang|reset> [locale] [--udid <udid>]}
shift
locale=""
udid=${SIM_UDID:-}
while [ $# -gt 0 ]; do
  case $1 in
    --udid) udid=$2; shift ;;
    *) locale=$1 ;;
  esac
  shift
done
if [ -z "$udid" ]; then
  udid=$(xcrun simctl list devices booted -j | sed -n 's/.*"udid" : "\([^"]*\)".*/\1/p' | head -1)
fi
[ -n "$udid" ] || { echo "sim-language: no booted simulator; pass --udid or set SIM_UDID" >&2; exit 1; }

prefs() { xcrun simctl spawn "$udid" defaults "$@"; }
xcrun simctl boot "$udid" 2>/dev/null || true
if [ "$lang" = reset ]; then
  prefs delete .GlobalPreferences AppleLanguages 2>/dev/null || true
  prefs delete .GlobalPreferences AppleLocale 2>/dev/null || true
else
  [ -n "$locale" ] || locale="${lang}_$(echo "$lang" | tr '[:lower:]' '[:upper:]')"
  prefs write .GlobalPreferences AppleLanguages -array "$lang"
  prefs write .GlobalPreferences AppleLocale "$locale"
fi
xcrun simctl shutdown "$udid"
xcrun simctl boot "$udid"
echo "sim-language: $udid -> ${lang}${locale:+ ($locale)}"
