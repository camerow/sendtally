#!/usr/bin/env bash
# Verify a just-deployed URL actually serves 2xx. A wrangler deploy reports
# success for a Worker that throws on every request, so the deploy is only
# green once the deployed code answers.
#
# The runner calls from an Azure datacenter range, which Cloudflare challenges
# by default. SMOKE_TOKEN is sent as x-sendtally-smoke so the WAF skip rule in
# infra/terraform/waf.tf lets the request through. That rule cannot cover Bot
# Fight Mode, which evaluates outside the Ruleset Engine - so on failure we
# print the mitigation headers naming whatever did challenge us.
set -euo pipefail

url="$1"
attempts="${2:-6}"
body="$(mktemp)"
headers="$(mktemp)"
trap 'rm -f "$body" "$headers"' EXIT

auth=()
[ -n "${SMOKE_TOKEN:-}" ] && auth=(-H "x-sendtally-smoke: ${SMOKE_TOKEN}")

status=000
for attempt in $(seq 1 "$attempts"); do
  status="$(curl -sS "${auth[@]}" -o "$body" -D "$headers" -w '%{http_code}' --max-time 20 "$url" || true)"
  [[ "$status" =~ ^[0-9]{3}$ ]] || status=000
  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    echo "OK ${status} ${url}"
    exit 0
  fi
  echo "attempt ${attempt}/${attempts}: ${url} returned ${status}"
  sleep $((attempt * 5))
done

echo "::error::${url} never returned 2xx (last status ${status})"

# cf-mitigated names the product that stopped us; cf-ray identifies the request
# in Security Events. Without these a challenge is indistinguishable from the
# Worker itself returning 403.
if grep -qiE '^(cf-mitigated|cf-ray|server):' "$headers"; then
  echo "--- Cloudflare response headers ---"
  grep -iE '^(cf-mitigated|cf-ray|server):' "$headers"
fi
if [ -z "${SMOKE_TOKEN:-}" ]; then
  echo "note: SMOKE_TOKEN was empty, so the WAF skip rule could not match."
fi

echo "--- first 2000 bytes of body ---"
head -c 2000 "$body"
exit 1
