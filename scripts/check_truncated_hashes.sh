#!/usr/bin/env bash
# Quick check for users with unusually short or missing password_hash values
set -euo pipefail

echo "Checking for users with missing or short password_hash (length < 40)"
docker compose exec db psql -U infrashop -d infrashop -c "SELECT id, email, display_name, COALESCE(length(password_hash),0) AS len FROM users ORDER BY len ASC LIMIT 200;"

echo "You can inspect specific suspicious rows with:"
echo "  docker compose exec db psql -U infrashop -d infrashop -c \"SELECT id,email,display_name,password_hash FROM users WHERE length(password_hash) < 40;\""
