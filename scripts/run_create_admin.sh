#!/usr/bin/env bash
# Run backend/scripts/create_admin.js inside a temporary Node container connected to the Compose network
# Usage:
#   ./scripts/run_create_admin.sh [--email email] [--password pass] [--display name] [--role admin|moderator]

set -euo pipefail

EMAIL="${ADMIN_EMAIL:-}"
PASSWORD="${ADMIN_PASSWORD:-}"
# Avoid clobbering the DISPLAY X11 env var; prefer ADMIN_DISPLAY_NAME
ADMIN_DISPLAY_NAME="${ADMIN_DISPLAY_NAME:-}"
ADMIN_ROLE="${ADMIN_ROLE:-admin}"

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --email)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --email" >&2; exit 1
      fi
      EMAIL="$2"; shift 2
      ;;
    --password)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --password" >&2; exit 1
      fi
      PASSWORD="$2"; shift 2
      ;;
    --display)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --display" >&2; exit 1
      fi
      ADMIN_DISPLAY_NAME="$2"; shift 2
      ;;
    --role)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --role" >&2; exit 1
      fi
      ADMIN_ROLE="$2"; shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--email email] [--password pass] [--display name] [--role admin|moderator]"; exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      echo "Usage: $0 [--email email] [--password pass] [--display name] [--role admin|moderator]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Missing credentials: pass --email and --password (or set ADMIN_EMAIL and ADMIN_PASSWORD)." >&2
  echo "Usage: $0 --email admin@example.com --password 'strong-password' [--display name] [--role admin|moderator]" >&2
  exit 1
fi

if [[ -z "$ADMIN_DISPLAY_NAME" ]]; then
  ADMIN_DISPLAY_NAME="$EMAIL"
fi

# ensure docker compose stack has a db service
DB_CID=$(docker compose ps -q db || true)
if [[ -z "$DB_CID" ]]; then
  echo "No 'db' service found in current docker compose project. Bring up the stack first." >&2
  exit 2
fi

# find first network attached to the db container
NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$DB_CID")
if [[ -z "$NET" ]]; then
  echo "Could not determine docker network for db container" >&2
  exit 3
fi

echo "Running create_admin.js on network: $NET (email=$EMAIL, role=$ADMIN_ROLE, display='$ADMIN_DISPLAY_NAME')"

TMP_NODE_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_NODE_DIR"' EXIT

# Mount an empty temporary node_modules to avoid picking up host-built native modules
docker run --rm \
  --network "$NET" \
  -e ADMIN_EMAIL="$EMAIL" \
  -e ADMIN_PASSWORD="$PASSWORD" \
  -e ADMIN_DISPLAY_NAME="$ADMIN_DISPLAY_NAME" \
  -e ADMIN_ROLE="$ADMIN_ROLE" \
  -e DB_HOST="${DB_HOST:-db}" \
  -e DB_USER="${DB_USER:-infrashop}" \
  -e DB_PASSWORD="${DB_PASSWORD:-supersecret}" \
  -e DB_NAME="${DB_NAME:-infrashop}" \
  -v "$(pwd)":/work -w /work \
  -v "$TMP_NODE_DIR":/work/backend/node_modules \
  node:18-bullseye-slim \
  sh -c "npm i bcrypt pg --no-audit --no-fund >/tmp/npm.log 2>&1 || (cat /tmp/npm.log; exit 1) && node backend/scripts/create_admin.js"
