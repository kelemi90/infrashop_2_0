# Update / Restart Commands

## Frontend (build + deploy static files + reload nginx)
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/frontend && npm ci --no-audit --no-fund && npm run build"
sudo mkdir -p /var/www/infrashop
sudo rm -rf /var/www/infrashop/*
sudo cp -r /srv/infrashop/frontend/dist/* /var/www/infrashop/
sudo chown -R www-data:www-data /var/www/infrashop
sudo nginx -t && sudo systemctl reload nginx
```

```bash
sudo chown -R infrashop:infrashop /srv/infrashop/frontend/dist || true
sudo -u infrashop bash -lc "cd /srv/infrashop/frontend && rm -rf dist && npm run build" && sudo rm -rf /var/www/infrashop/* && sudo cp -r /srv/infrashop/frontend/dist/* /var/www/infrashop/ && sudo chown -R www-data:www-data /var/www/infrashop && sudo nginx -t && sudo systemctl reload nginx
```

## Backend (recommended: systemd service)
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && npm run migrate:apply" # <Run after pulling backend changes>
sudo systemctl restart infrashop-backend.service # <This is important>
sudo systemctl status infrashop-backend.service --no-pager -l # <This is important>
sudo journalctl -u infrashop-backend.service -n 80 --no-pager
```

## Create backend-managed users
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && ADMIN_EMAIL=moderator@example.com ADMIN_PASSWORD='<MODERATOR_PASSWORD>' ADMIN_DISPLAY_NAME='Moderator' npm run create_moderator"
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<ADMIN_PASSWORD>' ADMIN_DISPLAY_NAME='Admin' npm run create_admin"
```
## Backend (manual fallback, if service is not used)
```bash
pkill -u infrashop -f '^/usr/bin/node server.js$' || true
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=infrashop DB_PASSWORD='<DB_PASSWORD>' DB_NAME=infrashop nohup /usr/bin/node server.js > /tmp/infrashop-backend.log 2>&1 &"
```

## Quick verification
```bash
curl -sS -i http://127.0.0.1:3000/api/health
curl -sS http://127.0.0.1:3000/api/items | head -c 600
```