#!/usr/bin/env bash
# Print release notes for a commit range, grouped by conventional commit type.
# Housekeeping types (chore, test, ci, style, build) are left out: a changelog
# is for people who use the thing, not for people who maintain it.
set -euo pipefail

range="$1"
shift
paths=("$@")

heading() {
  case "$1" in
    feat) echo "New" ;;
    fix) echo "Fixed" ;;
    perf) echo "Faster" ;;
    refactor | docs) echo "Other changes" ;;
    *) echo "" ;;
  esac
}

conventional='^([a-z]+)(\(([^)]*)\))?!?:[[:space:]]*(.*)$'

subjects=$(git log --no-merges --format='%h%x09%s' "$range" -- "${paths[@]}")

for group in New Fixed Faster "Other changes"; do
  body=""
  while IFS=$'\t' read -r sha subject; do
    [ -n "$subject" ] || continue
    [[ $subject =~ $conventional ]] || continue
    [ "$(heading "${BASH_REMATCH[1]}")" = "$group" ] || continue
    scope=${BASH_REMATCH[3]:+**${BASH_REMATCH[3]}:** }
    body+="- ${scope}${BASH_REMATCH[4]} (\`$sha\`)"$'\n'
  done <<<"$subjects"
  [ -n "$body" ] || continue
  printf '### %s\n\n%s\n' "$group" "$body"
done
