#!/usr/bin/env bash
# deploy_compose.sh
# Usage: ./scripts/deploy_compose.sh [branch]
# Default branch: serverilta
# This script is intended to be run on the server where the repository and docker-compose.yml live.
# It will:
#  - create a timestamped DB dump in ./backups
#  - git fetch && checkout the given branch and pull
#  - build backend and frontend images
#  - run migrations (schema.sql) inside backend image
#  - bring up backend/frontend/nginx with docker compose
#  - run the admin UI smoke-test (optional, requires jq)

set -euo pipefail
BRANCH=${1:-serverilta}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_USER=${POSTGRES_USER:-infrashop}
DB_NAME=${POSTGRES_DB:-infrashop}
DB_CONTAINER_NAME="$(docker compose ps -q db 2>/dev/null || true)"
BASE_URL=${BASE_URL:-http://localhost}

mkdir -p "$BACKUP_DIR"

echo "Creating DB dump to $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
if [[ -n "$DB_CONTAINER_NAME" ]]; then
  docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
else
  echo "DB container not found via docker compose; attempting to run pg_dump via docker compose run..."
  docker compose run --rm db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
fi

echo "Updating code (branch: $BRANCH)"
git fetch --all --prune
# checkout branch and pull latest
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git checkout -b "$BRANCH" "origin/$BRANCH"
fi

echo "Building backend and frontend images"
docker compose build backend frontend

echo "Applying DB schema/migrations"
# run migration via backend container
docker compose run --rm backend npm run migrate:apply

echo "Bringing services up (backend, frontend, nginx)"
docker compose up -d --no-deps --build backend frontend nginx

echo "Waiting briefly for services to start..."
sleep 5

# Optional smoke test (requires ./scripts/admin_ui_test.sh and jq)
if [[ -x ./scripts/admin_ui_test.sh ]]; then
  echo "Running admin UI smoke test (you will be asked for admin email/password)"
  read -rp "Admin email (press Enter to skip smoke test): " ADMIN_EMAIL
  if [[ -n "$ADMIN_EMAIL" ]]; then
    read -rsp "Admin password: " ADMIN_PASS
    echo
    BASE_URL="$BASE_URL" ./scripts/admin_ui_test.sh "$ADMIN_EMAIL" "$ADMIN_PASS" || {
      echo "Smoke test failed. Check logs: docker compose logs --no-color --tail=200 backend" >&2
      exit 10
    }
  else
    echo "Skipping smoke test"
  fi
else
  echo "Smoke test script not found or not executable; skipping smoke test"
fi

echo "Deployment complete. Check logs if needed: docker compose logs --no-color --tail=200 backend"
exit 0
