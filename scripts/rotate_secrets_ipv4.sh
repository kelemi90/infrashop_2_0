echo "Restarting backend service..."
#!/usr/bin/env bash
set -euo pipefail

# rotate_secrets_ipv4.sh
# Safely rotate the infrashop DB user's password and JWT secret, then restart backend.
# This variant forces IPv4 when checking the health endpoint (curl -4 / 127.0.0.1)
# Usage: ./scripts/rotate_secrets_ipv4.sh [CURRENT_DB_PASSWORD] [DB_CONTAINER_NAME]
# If CURRENT_DB_PASSWORD is omitted, defaults to 'supersecret'.
# If DB_CONTAINER_NAME is omitted, defaults to 'infrashop_2_0-db-1'.

CURRENT_DB_PASS="${1:-supersecret}"
DB_CONTAINER="${2:-infrashop_2_0-db-1}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
LOGFILE="$ROOT_DIR/scripts/rotate_secrets.log"

log() {
  # Timestamped log to file and stdout
  printf "[%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOGFILE"
}

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env not found at $ENV_FILE. Create it or run from repo root." >&2
  exit 1
fi

echo
echo "This will:"
echo " - rotate the password for DB role 'infrashop' inside container: $DB_CONTAINER"
echo " - update $ENV_FILE with a new POSTGRES_PASSWORD, JWT_SECRET and DATABASE_URL"
echo " - create a timestamped backup of the current .env"
echo
read -r -p "Proceed? [y/N]: " REPLY
if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
  echo "Aborted by user. No changes made.";
  exit 0
fi

log "Starting rotation (container=$DB_CONTAINER, env=$ENV_FILE)"

echo "Generating new secrets..."
NEW_DB_PASS=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)
NEW_JWT=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48)

log "Generated new secrets (not writing secrets to log file)"

log "Rotating DB password on container '$DB_CONTAINER' (connecting with provided current password)"

# Use echo piped into docker exec -> psql -f - and PGPASSWORD env var inside container to avoid shell quoting issues.
SQL_STATEMENT="ALTER USER infrashop WITH PASSWORD '$NEW_DB_PASS';"

if printf "%s\n" "$SQL_STATEMENT" | docker exec -i "$DB_CONTAINER" bash -lc "PGPASSWORD='$CURRENT_DB_PASS' psql -U infrashop -d infrashop -v ON_ERROR_STOP=1 -f -"; then
  log "ALTER USER succeeded"
else
  log "ERROR: ALTER USER failed. See container logs for details. Aborting and leaving .env untouched."
  exit 3
fi

# Create a timestamped backup of .env
TS=$(date +%Y%m%d%H%M%S)
BACKUP="$ENV_FILE.$TS.bak"
cp "$ENV_FILE" "$BACKUP"
log "Created .env backup: $BACKUP"

# Update .env in-place
if grep -qE '^POSTGRES_PASSWORD=' "$ENV_FILE"; then
  sed -i -E "s#^POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=$NEW_DB_PASS#" "$ENV_FILE"
else
  echo "POSTGRES_PASSWORD=$NEW_DB_PASS" >> "$ENV_FILE"
fi

if grep -qE '^JWT_SECRET=' "$ENV_FILE"; then
  sed -i -E "s#^JWT_SECRET=.*#JWT_SECRET=$NEW_JWT#" "$ENV_FILE"
else
  echo "JWT_SECRET=$NEW_JWT" >> "$ENV_FILE"
fi

if grep -qE '^DATABASE_URL=' "$ENV_FILE"; then
  sed -i -E "s#^DATABASE_URL=.*#DATABASE_URL=postgresql://infrashop:$NEW_DB_PASS@db:5432/infrashop#" "$ENV_FILE"
else
  echo "DATABASE_URL=postgresql://infrashop:$NEW_DB_PASS@db:5432/infrashop" >> "$ENV_FILE"
fi

chmod 600 "$ENV_FILE"
log "Updated $ENV_FILE with new credentials and set permissions to 600"

echo "Restarting backend service..."
( docker compose up -d --build backend >/dev/null 2>&1 ) || ( docker compose up -d backend )

# Give backend a couple seconds to come up
sleep 3

log "--- backend recent logs ---"
docker compose logs --no-color --tail=200 backend | sed -n '1,200p' | tee -a "$LOGFILE"

log "Checking /api/health over IPv4 (127.0.0.1)..."
HEALTH=$(curl -4 -sS --fail http://127.0.0.1:3000/api/health || true)
if [ -z "$HEALTH" ]; then
  log 'Warning: health endpoint did not return a response or returned non-2xx';
  log "You should inspect backend logs above. If the backend cannot connect to DB, it may be using the old password."
  echo "Rotation failed: health endpoint check failed. See $LOGFILE for details."
  exit 2
else
  log "Health OK: $HEALTH"
  echo "Health: $HEALTH"
fi

log "Rotation complete (secrets not displayed). .env updated at: $ENV_FILE"
echo "Rotation complete. Backup saved at: $BACKUP"

# End of script
