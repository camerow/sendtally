#!/usr/bin/env bash
# Print "<next version> <bump>" for a commit range, per conventional commits.
# The caller supplies the current version because the two releases keep it in
# different places: mobile in app.json, web in the last tag.
set -euo pipefail

current="$1"
range="$2"
shift 2

log=$(git log --format='%s%n%b' "$range" -- "$@")
bump=patch
if grep -qE '^feat(\([^)]*\))?:' <<<"$log"; then bump=minor; fi
if grep -qE '^BREAKING CHANGE|^[a-z]+(\([^)]*\))?!:' <<<"$log"; then bump=major; fi

IFS=. read -r major minor patch <<<"$current"
major=${major:-0} minor=${minor:-0} patch=${patch:-0}
# Pre-1.0, a breaking change is a minor bump, per semver's 0.y rule.
if [ "$bump" = major ] && [ "$major" = 0 ]; then bump=minor; fi
case $bump in
  major) echo "$((major + 1)).0.0 $bump" ;;
  minor) echo "$major.$((minor + 1)).0 $bump" ;;
  patch) echo "$major.$minor.$((patch + 1)) $bump" ;;
esac
