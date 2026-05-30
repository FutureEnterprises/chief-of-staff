#!/usr/bin/env bash
#
# CI guard: assert that the SPKI pins in Info.plist match the live
# certificate served by the pinned host. Run before every iOS release
# build — including TestFlight — to prevent a mismatch that would
# brick the install base.
#
# Usage:
#   scripts/check-spki-pin-matches-info-plist.sh [<host>] [<info-plist-path>]
#
# Defaults:
#   host = api.coyl.ai
#   info-plist-path = apps/ios-rebound/Sources/Rebound/Info.plist
#
# Exit codes:
#   0  — at least one pin in Info.plist matches the live host
#   1  — no pin matches; SHIPPING THIS APP WOULD BRICK THE INSTALL BASE
#   2  — bad usage (missing dependency, host unreachable, etc.)
#   3  — placeholders still present; skip with a warning
#
# CI integration: add to .github/workflows/ios-release.yml as a
# required step before xcodebuild archive. Recommended to also run
# manually after every cert rotation per docs/security/ios-cert-
# pinning-rotation.md.

set -euo pipefail

host="${1:-api.coyl.ai}"
plist="${2:-apps/ios-rebound/Sources/Rebound/Info.plist}"

for bin in openssl base64 grep; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "error: required binary '$bin' not found" >&2
    exit 2
  fi
done

if [[ ! -f "$plist" ]]; then
  echo "error: Info.plist not found at $plist" >&2
  exit 2
fi

# Extract pin values from the plist. We're parsing XML with grep,
# which is fragile but adequate for the simple SPKI-SHA256-BASE64
# entries the rotation runbook produces. If the plist format ever
# grows complex, swap to PlistBuddy.
pins=$(grep -E '^[[:space:]]*<string>[A-Za-z0-9+/]{43}=</string>$' "$plist" \
  | sed -E 's@^[[:space:]]*<string>(.*)</string>[[:space:]]*$@\1@' \
  || true)

# Check for placeholder values — if any are still in the plist, the
# scaffold hasn't been replaced with real pins yet. Warn and exit 3
# so CI can choose to allow this for non-prod builds.
if grep -q "REPLACE_WITH" "$plist"; then
  echo "warning: placeholders still in Info.plist (pre-TestFlight state)" >&2
  echo "         run scripts/compute-spki-pin.sh $host to get a real pin" >&2
  exit 3
fi

if [[ -z "$pins" ]]; then
  echo "error: no SPKI pins found in $plist" >&2
  echo "       expected at least one <string>...44-char-base64...</string>" >&2
  exit 1
fi

# Compute the live SPKI for the host.
live_pin=$(echo | \
  openssl s_client -servername "$host" -connect "${host}:443" 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der 2>/dev/null \
  | openssl dgst -sha256 -binary \
  | base64)

if [[ ! "$live_pin" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
  echo "error: could not retrieve a valid leaf cert from $host" >&2
  exit 2
fi

echo "  host:     $host"
echo "  live pin: $live_pin"
echo "  plist pins:"
while IFS= read -r p; do
  echo "    $p"
done <<< "$pins"

# Match — does any pin in the plist equal the live pin?
if grep -qFx "$live_pin" <<< "$pins"; then
  echo
  echo "ok: live pin for $host matches a pin in $plist"
  exit 0
fi

echo
echo "FAIL: live pin for $host does not match ANY pin in $plist" >&2
echo "      shipping this build would brick the install base." >&2
echo "      either rotate the cert to match a pinned key, or update the plist." >&2
echo "      see docs/security/ios-cert-pinning-rotation.md" >&2
exit 1
