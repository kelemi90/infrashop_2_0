# Infrashop — self-hosted LAN store

## Quick dev run (local)

1. Start postgres (recommended: docker compose)
2. Run migrations:
   - copy `backend/migrations/schema.sql` to a postgres instance:
     `psql postgresql://infrashop:supersecret@localhost:5432/infrashop -f backend/migrations/schema.sql`
   - `psql postgresql://infrashop:supersecret@localhost:5432/infrashop -f backend/migrations/import_items.sql`
3. Start backend:
   - cd backend && npm install && npm run dev
4. Start frontend:
   - cd frontend && npm install && npm run dev
5. Browse: http://localhost:5173

Note: when running via Docker (see below) the frontend is served through nginx on port 80 by default; the Vite dev server still runs on 5173 when started with `npm run dev`.

## Docker (docker compose)

The repository includes a `docker-compose.yml` that builds and runs the stack (Postgres, backend, frontend, nginx). The backend serves static images from `backend/public/images` at the path `/images` and the compose file mounts the host `./backend/public/images` into the backend container so you can add images on the host and have them available inside the container. The recommended CLI is the Docker plugin form `docker compose` (no hyphen).

Typical workflow to build and run the project with Docker:

1. Build and start the stack (from project root):

```bash
docker compose up -d --build
```

2. Watch logs (in another terminal):

```bash
docker compose logs -f backend nginx
```

3. The backend listens on port 3000 and nginx exposes the app on port 80. Nginx is configured to proxy `/api/` to the backend and (important) `/images/` to the backend so image requests from the browser are served correctly.

### Verifying images are served

You can verify an example image (for example `arkkupakastin.jpg`) is served directly from the backend:

```bash
curl -I http://localhost:3000/images/arkkupakastin.jpg
```

Expected: HTTP 200 and a `Content-Type: image/jpeg` (or similar).

You can also verify via nginx (how the browser normally requests them):

```bash
curl -I http://localhost/images/arkkupakastin.jpg
```

If both return 200, the image serving is working.

Note about persistence: the setup helper (`scripts/setup_prod.sh`) will detect when `backend/public/images` is backed by a named Docker volume and can populate that volume from the repo on first run; backups are created under `scripts/backup/` unless you pass `--no-backup`.

### Files and config notes

- Backend serves static images from `public/images` via Express: see `backend/server.js` (express.static). The Docker Compose mounts `./backend/public/images` into the backend container so files placed there on the host are available inside the container.
- Nginx proxies `/images/` to the backend (see `nginx/infrashop.conf`). This ensures images are available when requesting the site through nginx (port 80).
- Frontend expects `image_url` values coming from the API to be either:
  - a plain filename (e.g. `arkkupakastin.jpg`) — frontend helper will build `/images/<filename>`
  - an absolute URL (starting with `http://` or `https://`) — used as-is
  - a path starting with `/` — respected as a path and prefixed with `VITE_API_URL` when configured

### Frontend dev server / Vite

If you run the frontend dev server (Vite) separately during development, you can set the backend origin so the frontend can call the API and image endpoints directly. Create `frontend/.env` with:

```
VITE_API_URL=http://localhost:3000
```

Then restart the frontend dev server so Vite picks up the env var. When serving the frontend through nginx in Docker, you generally can use relative paths (no `VITE_API_URL` needed).

### Useful docker commands

-- Rebuild and restart: `docker compose up -d --build`
-- Tail logs: `docker compose logs -f` or `docker compose logs -f backend nginx`
-- List containers: `docker compose ps`
- Exec into backend to list images:

```bash
docker compose exec backend ls -la /app/public/images
```

You should see `arkkupakastin.jpg` and `no-image.png` listed if the host folder contains them.

### Troubleshooting

  - Verify the file exists in `backend/public/images` on the host.
  - Verify the file appears inside the backend container (see last `docker compose exec` command).
  - Check `docker compose logs backend` for errors.

## Database rebuild & import (safe steps)

If you need to rebuild the database inside Docker (wipe and re-import from `varasto.csv`), follow these safe steps. WARNING: removing volumes deletes the Postgres data — take a backup first.

1. Backup current DB (recommended):

```bash
# run pg_dump inside the running db container
docker compose up -d db
docker compose exec db pg_dump -U infrashop -Fc infrashop -f /tmp/db_backup.dump
docker cp "$(docker compose ps -q db)":/tmp/db_backup.dump ./db_backup.dump
```

2. Stop containers and remove volumes (this will delete the DB):

```bash
docker compose down -v --remove-orphans
```

3. Rebuild & start services (this creates a fresh DB volume):

```bash
docker compose up -d --build
```

4. Run schema + import (the repo includes migration files):

```bash
# copy migration files and CSV into the db container and run them
docker cp backend/migrations/schema.sql "$(docker compose ps -q db)":/tmp/schema.sql
docker cp backend/migrations/import_items.sql "$(docker compose ps -q db)":/tmp/import_items.sql
docker cp backend/varasto.csv "$(docker compose ps -q db)":/varasto.csv
docker compose exec db psql -U infrashop -d infrashop -f /tmp/schema.sql
docker compose exec db psql -U infrashop -d infrashop -f /tmp/import_items.sql
```

Notes:
- `import_items.sql` in `backend/migrations` uses a staging table and normalizes `image_url` values (it strips leading `public/images/` and `images/` prefixes) so the DB stores only filenames like `arkkupakastin.jpg`.
- If you prefer, you can run `backend/migrations/normalize_image_urls.sql` afterwards to normalize existing rows.

## Image URL normalization and assignment

The project follows this convention for `items.image_url`:
- store a filename only (e.g. `arkkupakastin.jpg`)
- frontend builds image URLs under `/images/<filename>` (Nginx proxies `/images/` to the backend)

The repo contains two safety nets:
- `backend/migrations/import_items.sql` normalizes during import so bad prefixes in CSV don't get into the DB.
- `frontend/src/utils/imageUrl.js` defensively strips common prefixes if something slips through.

If you have image files in `backend/public/images` and need to assign them to items, use one of these workflows:

1. Quick automatic (dry-run then apply): use filename base (without extension) to match `sku` or `name`.

Dry-run to review candidates:

```bash
for f in backend/public/images/*; do
  fname=$(basename "$f")
  base="${fname%.*}"
  echo "==> file: $fname (base: $base)"
  docker compose exec db psql -U infrashop -d infrashop -t -c "SELECT id,sku,name FROM items WHERE (image_url IS NULL OR image_url='') AND (sku = '${base}' OR lower(name) LIKE '%${base}%') ORDER BY id;"
done
```

Apply updates (ONLY after reviewing dry-run):

```bash
for f in backend/public/images/*; do
  fname=$(basename "$f")
  base="${fname%.*}"
  docker compose exec db psql -U infrashop -d infrashop -c "BEGIN; UPDATE items SET image_url='${fname}' WHERE (image_url IS NULL OR image_url='') AND (sku='${base}' OR lower(name) LIKE '%${base}%'); COMMIT;"
done
```

2. Explicit mapping via CSV (recommended for large/ambiguous sets):

- Create `image_mapping.csv` with header `filename,sku` (or `filename,item_id`).
- Copy into the db container and run SQL to apply the mapping (see comments in repository for an example).

3. Manual edits: use psql or your DB GUI to update individual rows:

```sql
UPDATE items SET image_url='arkkupakastin.jpg' WHERE id=77;
```

After updating, verify via API and HTTP:

```bash
curl -sS http://localhost/api/items | jq '.[] | select(.image_url!=null) | {id,name,image_url}' | sed -n '1,200p'
curl -I http://localhost/images/arkkupakastin.jpg
```

If you want, add the mapping CSV and a migration so future runs seed with the correct `image_url` values automatically.

--

## Admin user (create/promote) — updated workflow

New safe helper: `scripts/run_create_admin.sh`

This project now includes a small, portable helper that runs the admin creation script inside a temporary Node container attached to the Compose network. This avoids needing Node/bcrypt inside the production backend image and prevents truncated hashes when creating/updating users.

Usage (non-interactive):

```bash
# explicit credentials are required
./scripts/run_create_admin.sh --email admin@example.com --password 'strong-password'

# specify credentials
./scripts/run_create_admin.sh --email admin@example.com --password S3cret --display 'Site Admin'
```

The `scripts/setup_prod.sh` setup helper now calls this wrapper during bootstrap (it respects `--dry-run` and `--no-backup` flags). If the wrapper fails, the setup script will fall back to an internal hash generation method.

If you prefer to manually create and promote a user, the old instructions still work (signup via API + psql promote). There's also a `scripts/check_truncated_hashes.sh` helper that lists users with unusually short `password_hash` values so you can inspect and fix them.

## Dependency security: npm overrides and rationale

During a recent dependency audit we upgraded a set of direct dependencies (backend and frontend) and introduced a short-term `npm` override in `frontend/package.json` to pin `picomatch` to a safe, non-vulnerable version. The override is a conservative, temporary mitigation for a transitive vulnerability that is still present in one or more upstream packages (for example `micromatch` / `@parcel/watcher`).

Why an override?
- Some advisories affect deeply nested packages. Waiting for every upstream package to release and for those releases to be pulled through can take time; an `overrides` entry forces a safe version across the dependency tree immediately.

What to do next
- When upstream projects release fixes, remove the `overrides` entry and run `npm install` to allow the normal dependency graph to resume.
- Prefer upgrading the direct parent packages (for example `@tailwindcss/cli` or `micromatch`) where possible; removing the override is the long-term goal.
- The project includes a CI job that will run `npm audit --audit-level=moderate` on both `frontend` and `backend` to catch regressions (see `.github/workflows/npm-audit.yml`).

If you're uncertain about changing the override, open a draft PR and run the project's CI to confirm there are no new advisories.

## Admin user (create/promote)

To use admin-only features (creating/editing item groups, managing returns, editing orders as admin), you need an admin user. Two safe options:

1) Create a normal user via the API and promote to admin in the DB:

```bash
# create account (signup)
curl -X POST http://localhost/api/auth/signup -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"secret","display_name":"Admin"}'

# then promote using psql
docker compose exec db psql -U infrashop -d infrashop -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

2) Create an admin user directly with a bcrypt-hashed password (example using node on your host):

```bash
# generate hash (requires node + bcrypt installed on host)
node -e "console.log(require('bcrypt').hashSync('supersecret', 10))"

# then insert via psql
docker compose exec db psql -U infrashop -d infrashop -c "INSERT INTO users (email,password_hash,display_name,role) VALUES ('admin@example.com','<HASH_FROM_NODE>','Admin','admin');"
```

After creating an admin user, log in via `POST /api/auth/login` to obtain a JWT and store it in `localStorage` under `token` (the frontend picks it up automatically). Example response contains `token` that you can paste into browser devtools console:

```js
localStorage.setItem('token','<JWT_TOKEN>')
location.reload()
```

Now the Admin UI (Admin → Arkisto) will allow creating item groups and editing their items.

## Production (docker compose)
1. Set envs (DATABASE_URL, JWT_SECRET).
2. Place TLS certs at path referenced in nginx config or configure certbot.
3. Run:

```bash
docker compose up -d --build
```

## psql
You can run psql with following command:
- `docker exec -it <project>_db_1 psql -U infrashop infrashop`

Example: drop column from `orders` (SQL example):
```sql
ALTER TABLE orders DROP COLUMN email;
```
