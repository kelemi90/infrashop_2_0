Release checklist and rollback

This document describes a minimal safe release process for InfraShop and a tested rollback plan.

Before you begin
- Ensure you have access to production secrets (JWT_SECRET, DB credentials, certs) in a secure store.
- Ensure CI builds are green (frontend + integration smoke).
- Ensure you have an up-to-date DB backup.

1) Create DB backup (required)

```bash
# run on the machine that can access the production DB
docker compose exec -T db pg_dump -U ${POSTGRES_USER:-infrashop} -d ${POSTGRES_DB:-infrashop} > /tmp/infrashop_dump_$(date +%F).sql
# verify file exists and size > 0
ls -lh /tmp/infrashop_dump_*.sql
```

2) Update secrets in production
- Set or rotate `JWT_SECRET` and other secrets in your secrets manager or environment.
- Example (on the server):
```bash
# create .env from .env.example and fill values
cp .env.example .env
# edit .env and set real passwords/secrets
# restart services after saving .env
```

3) Deploy
- If you deploy with Docker Compose:
```bash
# pull new images (if you use a registry) or build locally
docker compose pull || true
docker compose up -d --build
```
- If you deploy with Ansible or other tooling, run the prepared playbook.

4) Smoke tests
- Health endpoint should respond:
```bash
curl -sS https://your-host/api/health | jq
```
- Login test (use a production admin account):
```bash
curl -i -X POST https://your-host/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"<password>"}'
```

5) Rollback (if something fails)
- Restore previous DB (if needed) from backup:
```bash
# restore to a temporary DB first, verify, then swap
cat /tmp/infrashop_dump_YYYY-MM-DD.sql | docker compose exec -T db psql -U ${POSTGRES_USER:-infrashop} -d ${POSTGRES_DB:-infrashop}
```
- Revert the code deployment:
```bash
# if deployed from git, check out the prior tag/commit and re-deploy
git checkout <previous-release-tag-or-commit>
docker compose up -d --build
```

6) Post-release
- Monitor logs and metrics for errors and performance regressions.
- Keep backup retention for N days (team policy).

Notes
- Migrations: this repo currently uses `backend/migrations/schema.sql` and a helper to apply it. Consider switching to a migration tool (node-pg-migrate, Flyway) for versioned, repeatable migrations.
- Secrets: never commit `.env` with real secrets. Use an external secret manager (Ansible Vault, HashiCorp Vault, or cloud secrets).
