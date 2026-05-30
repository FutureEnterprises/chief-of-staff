#!/usr/bin/env bash
#
# Compute the SPKI-SHA256-base64 pin for a host's TLS leaf certificate.
# Output is the exact string that goes in NSPinnedLeafIdentities in
# apps/ios-rebound/Sources/Rebound/Info.plist.
#
# Usage:
#   scripts/compute-spki-pin.sh <hostname> [<port>]
#
# Examples:
#   scripts/compute-spki-pin.sh api.coyl.ai
#   scripts/compute-spki-pin.sh staging-api.coyl.ai 443
#
# Behavior:
#   - Pulls the live leaf certificate via openssl s_client
#   - Extracts the SubjectPublicKeyInfo, DER-encodes it
#   - SHA-256 hashes the DER bytes
#   - Base64-encodes the 32-byte hash → 44-character pin
#
# Notes:
#   - The pin is tied to the public KEY, not the cert. If your cert
#     renewal preserves the key, the pin stays valid. Most CAs do
#     not preserve keys across renewals; assume you'll rotate.
#   - See docs/security/ios-cert-pinning-rotation.md for the rotation
#     runbook (current + backup pin discipline).

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 <hostname> [<port>]" >&2
  exit 2
fi

host="$1"
port="${2:-443}"

# Verify dependencies exist.
for bin in openssl base64; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "error: required binary '$bin' not found in PATH" >&2
    exit 1
  fi
done

# Pull the leaf cert, extract its SPKI, hash, base64.
pin=$(echo | \
  openssl s_client -servername "$host" -connect "${host}:${port}" 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der 2>/dev/null \
  | openssl dgst -sha256 -binary \
  | base64)

# Validate output looks like a SHA-256-base64 (44 chars, ends in '=').
if [[ ! "$pin" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
  echo "error: computed pin doesn't look right: $pin" >&2
  echo "       (expected 44 base64 chars ending in '=')" >&2
  exit 1
fi

echo "$pin"
