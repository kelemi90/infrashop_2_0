#!/usr/bin/env bash
set -euo pipefail

# Production / server setup helper for Infrashop
# Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASS=secret ./scripts/setup_prod.sh
# The script is interactive if required env vars are missing.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { echo "[setup] $*"; }
err() { echo "[error] $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || err "Required command '$1' not found. Install it and re-run."
}

require_cmd docker
require_cmd docker

# Defaults and flags
: "${ADMIN_EMAIL:=${ADMIN_EMAIL:-}}"
: "${ADMIN_PASS:=${ADMIN_PASS:-}}"
: "${ADMIN_NAME:=${ADMIN_NAME:-Admin}}"

# Flags
DRY_RUN=0
DO_BACKUP=1

usage() {
  cat <<EOF
Usage: ADMIN_EMAIL=you@host ADMIN_PASS=pass [--dry-run] [--no-backup] bash scripts/setup_prod.sh
  --dry-run   Print actions that would be performed, but don't execute them
  --no-backup Skip creating a tar backup of the image volume before populating it
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --no-backup) DO_BACKUP=0; shift ;;
    --help) usage; exit 0 ;;
    *) break ;;
  esac
done

if [ -z "$ADMIN_EMAIL" ]; then
  read -rp "Admin email to create/promote: " ADMIN_EMAIL
fi
if [ -z "$ADMIN_PASS" ]; then
  read -rsp "Password for admin user (will be used to create account): " ADMIN_PASS
  echo
fi

# Ensure images directory exists on host so docker compose bind mount persists files
mkdir -p backend/public/images
chmod 755 backend/public/images || true

log "Bringing up docker compose services (db, backend, frontend, nginx)..."
docker compose up -d --build

# If the backend's /app/public/images mount is a named volume, populate it with
# any files from the repo's backend/public/images so the volume isn't empty.
log "Checking backend image mount to see if population is needed..."
BACKEND_CID=$(docker compose ps -q backend || true)
if [ -n "$BACKEND_CID" ]; then
  # output lines like: <Destination>::<Name>::<Source> for each mount
  MOUNTS=$(docker inspect -f '{{range .Mounts}}{{printf "%s::%s::%s\\n" .Destination .Name .Source}}{{end}}' "$BACKEND_CID" 2>/dev/null || true)
  if [ -n "$MOUNTS" ]; then
    while IFS= read -r line; do
      dest=$(printf '%s' "$line" | cut -d:: -f1)
      vname=$(printf '%s' "$line" | cut -d:: -f2)
      src=$(printf '%s' "$line" | cut -d:: -f3)
      if [ "$dest" = "/app/public/images" ]; then
        if [ -n "$vname" ]; then
          log "Detected named volume '$vname' mounted to /app/public/images."
          if [ "$DRY_RUN" -eq 1 ]; then
            log "DRY-RUN: Would create backup (unless --no-backup) and populate volume '$vname' from host folder backend/public/images"
          else
            if [ "$DO_BACKUP" -eq 1 ]; then
              BACKUP_DIR="$(pwd)/scripts/backup"
              mkdir -p "$BACKUP_DIR"
              log "Creating tarball backup of volume '$vname' into $BACKUP_DIR..."
              docker run --rm -v "${vname}":/data -v "$BACKUP_DIR":/backup alpine sh -c "tar czf /backup/${vname}_$(date +%s).tar.gz -C /data . || true"
              log "Backup completed."
            else
              log "Skipping backup (user requested --no-backup)."
            fi
            log "Populating volume '$vname' from host repo folder..."
            docker run --rm -v "$(pwd)/backend/public/images":/src -v "${vname}":/dest alpine sh -c "cp -a /src/. /dest/ || true"
            log "Population of volume '$vname' completed."
          fi
        else
          log "Detected a host bind mount for /app/public/images (source: $src). No population needed."
        fi
      fi
    done <<< "$MOUNTS"
  else
    log "No mounts data available for backend container; skipping image volume population check."
  fi
else
  log "Backend container not found; skipping image volume population check."
fi

log "Waiting for Postgres to be ready..."
DB_CONTAINER=$(docker compose ps -q db)
if [ -z "$DB_CONTAINER" ]; then
  err "Could not find db container. Is it defined in docker-compose.yml?"
fi

until docker compose exec -T db pg_isready -U infrashop -d infrashop >/dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo
log "Postgres is ready."

# Check whether schema is already applied (presence of items table)
HAS_ITEMS=$(docker compose exec -T db psql -U infrashop -d infrashop -tAc "SELECT to_regclass('public.items');" | tr -d '[:space:]') || true
if [ -n "$HAS_ITEMS" ]; then
  log "Database schema appears to be present (items table found). Skipping schema import."
else
  log "Applying schema and importing initial data..."
  docker cp backend/migrations/schema.sql "$DB_CONTAINER":/tmp/schema.sql
  docker cp backend/migrations/import_items.sql "$DB_CONTAINER":/tmp/import_items.sql
  docker cp backend/varasto.csv "$DB_CONTAINER":/varasto.csv
  docker compose exec -T db psql -U infrashop -d infrashop -f /tmp/schema.sql
  docker compose exec -T db psql -U infrashop -d infrashop -f /tmp/import_items.sql
  log "Schema and data import completed."
fi

# Ensure images from repository (if any) are available in the backend images dir
if [ -d "backend/public/images" ]; then
  log "backend/public/images directory exists on host. (Ensure you placed product images here if needed.)"
fi

# Create or promote admin user
log "Creating or promoting admin user: $ADMIN_EMAIL"
# Generate bcrypt hash inside a node one-liner using the backend image's node (if available)
HASH=$(docker compose exec -T backend node -e "console.log(require('bcrypt').hashSync(process.env.PASS,10))"  PASS="$ADMIN_PASS" 2>/dev/null || true)
if [ -z "$HASH" ]; then
  log "Backend container doesn't expose node or bcrypt; attempting to use host node..."
  if command -v node >/dev/null 2>&1; then
    HASH=$(node -e "console.log(require('bcrypt').hashSync(process.env.PASS,10))" PASS="$ADMIN_PASS")
  else
    err "Could not generate bcrypt hash (no node available in backend container or host). Provide an already hashed password in SQL or install node."
  fi
fi

EXISTS=$(docker compose exec -T db psql -U infrashop -d infrashop -tAc "SELECT COUNT(*) FROM users WHERE email='${ADMIN_EMAIL}';" | tr -d '[:space:]') || true
if [ "$EXISTS" = "0" ] || [ -z "$EXISTS" ]; then
  log "Inserting new admin user..."
  docker compose exec -T db psql -U infrashop -d infrashop -c "INSERT INTO users (email,password_hash,display_name,role) VALUES ('${ADMIN_EMAIL}','${HASH}','${ADMIN_NAME}','admin');"
  log "Admin user created."
else
  log "User exists; promoting to admin and updating password hash..."
  docker compose exec -T db psql -U infrashop -d infrashop -c "UPDATE users SET role='admin', password_hash='${HASH}' WHERE email='${ADMIN_EMAIL}';"
  log "User promoted to admin and password updated."
fi

log "Setup complete."
echo
echo "Next steps / verification commands (run on the server):"
echo
echo "- Tail logs:"
echo "  docker compose logs -f backend nginx"
echo
echo "- Verify image serving (example):"
echo "  curl -I http://localhost/images/arkkupakastin.jpg"
echo
echo "- To create more admin users, run the signup flow and then promote via psql or rerun this script."

exit 0
