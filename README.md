# Infrashop — self-hosted LAN store

## Quick dev run (local)
1. Start postgres (recommended: docker-compose)
2. Run migrations:
   - copy `backend/migrations/schema.sql` to a postgres instance:
     `psql postgresql://infrashop:supersecret@localhost:5432/infrashop -f backend/migrations/schema.sql`
   - `psql postgresql://infrashop:supersecret@localhost:5432/infrashop -f backend/migrations/import_items.sql`
3. Start backend:
   - cd backend && npm install && npm run dev
4. Start frontend:
   - cd frontend && npm install && npm run dev
5. Browse: http://localhost:5173

## Production (docker-compose)
1. Set envs (DATABASE_URL, JWT_SECRET).
2. Place TLS certs at path referenced in nginx config or configure certbot.
3. Run:# infrashop_2_0

