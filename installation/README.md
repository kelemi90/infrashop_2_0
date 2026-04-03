# Infrashop — Installation guide (no Docker)

This guide walks through installing Infrashop to a clean Ubuntu/Debian server without Docker. It provides copy/pasteable commands and minimal explanation so you can run them from any machine (SSH into the target server first).

Quick note: there is an automated, idempotent installer script at `installation/install-ubuntu.sh` in this repository that performs the same steps interactively. You can run that script instead of manually following this README:

```bash
sudo bash installation/install-ubuntu.sh
```

The rest of this README mirrors what the script does and is useful for auditing, manual installs, or customizing the steps.

Before you begin
- You control the server (SSH access) and can run sudo.
- You own the DNS for the domain `infrashop.vectorama.fi` (or will point it to the server IP before obtaining TLS certs).
- This guide targets Ubuntu/Debian. If you use another distro, adapt package commands accordingly.

High-level steps
1. Install prerequisites (Node.js 20, PostgreSQL 15, nginx, certbot, git, build tools).
2. Create an `infrashop` system user and clone the repo into `/srv/infrashop`.
3. Create a secure `.env`, create DB user + DB, apply the schema or restore a dump.
4. Install backend dependencies, build frontend, copy static files to nginx webroot.
5. Create a systemd service for the backend and configure nginx as a reverse proxy.
6. Obtain TLS certs with certbot (webroot) and enable automatic renewal.

Copyable commands (run on the server)
--------------------------------------------------
Step 0 — SSH to the server
```bash
ssh youruser@your-server-ip
```

Step 1 — Update and install basic packages
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl build-essential ufw ca-certificates lsb-release gnupg
```

Step 2 — Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

Step 3 — Install PostgreSQL
We recommend installing the latest stable PostgreSQL major release (PostgreSQL 18 as of 2026-03-30). Use the official PostgreSQL APT repo to get the newest supported packages.

```bash
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/pgdg.gpg
echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-18
sudo systemctl enable --now postgresql
```

Create DB role and database (replace `<DB_PASSWORD>`):
```bash
sudo -u postgres psql -c "CREATE ROLE infrashop WITH LOGIN PASSWORD '<DB_PASSWORD>';"
sudo -u postgres psql -c "CREATE DATABASE infrashop OWNER infrashop;"
sudo systemctl restart postgresql
```

Step 4 — Create app user and clone repository
```bash
sudo useradd -m -s /bin/bash infrashop || true
sudo mkdir -p /srv/infrashop
sudo chown infrashop:infrashop /srv/infrashop
sudo -u infrashop git clone https://github.com/kelemi90/infrashop_2_0.git /srv/infrashop
# If private repo, use SSH clone and configure deploy key
```

Step 5 — Create `.env` file (secure)
Replace placeholders before running.
```bash
cat > /tmp/infrashop.env <<'EOF'
POSTGRES_DB=infrashop
POSTGRES_USER=infrashop
POSTGRES_PASSWORD=<DB_PASSWORD>
DATABASE_URL=postgresql://infrashop:<DB_PASSWORD>@127.0.0.1:5432/infrashop
JWT_SECRET=$(head -c 32 /dev/urandom | base64)
PORT=3000
NODE_ENV=production
EOF

sudo mv /tmp/infrashop.env /srv/infrashop/.env
sudo chown infrashop:infrashop /srv/infrashop/.env
sudo chmod 600 /srv/infrashop/.env
```

Step 6 — Apply schema or restore dump
- Option A: apply SQL schema distributed in the repo (safe if you don't have a dump):
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && npm ci --no-audit --no-fund && \
  export DATABASE_URL=postgresql://infrashop:<DB_PASSWORD>@127.0.0.1:5432/infrashop && npm run migrate:apply"
```
- Option B: restore from a dump (if you have `db_backup.dump`):
```bash
# copy dump to server then
sudo -u postgres pg_restore -d infrashop /path/to/db_backup.dump
# or for plain SQL: sudo -u postgres psql -d infrashop -f /path/to/dump.sql
```

Step 7 — Create an admin user
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && \
  export DATABASE_URL=postgresql://infrashop:<DB_PASSWORD>@127.0.0.1:5432/infrashop && \
    export ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<ADMIN_PASSWORD>' && npm run create_admin"
```

Create a moderator user the same way when you want catalog-management access without full admin rights:
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && \
    export DATABASE_URL=postgresql://infrashop:<DB_PASSWORD>@127.0.0.1:5432/infrashop && \
    export ADMIN_EMAIL=moderator@example.com ADMIN_PASSWORD='<MODERATOR_PASSWORD>' ADMIN_DISPLAY_NAME='Moderator' && npm run create_moderator"
```
Step 8 — Install backend production dependencies
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/backend && npm ci --production --no-audit --no-fund"
```

Step 9 — Build frontend and deploy static files
```bash
sudo -u infrashop bash -lc "cd /srv/infrashop/frontend && npm ci --no-audit --no-fund && npm run build"
sudo mkdir -p /var/www/infrashop
sudo rm -rf /var/www/infrashop/*
sudo cp -r /srv/infrashop/frontend/dist/* /var/www/infrashop/
sudo chown -R www-data:www-data /var/www/infrashop
```

Step 10 — Create systemd service for backend
Create `/etc/systemd/system/infrashop-backend.service` with the content below (use sudo tee):
```ini
[Unit]
Description=Infrashop backend
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=infrashop
Group=infrashop
WorkingDirectory=/srv/infrashop/backend
EnvironmentFile=/srv/infrashop/.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now infrashop-backend.service
sudo journalctl -u infrashop-backend -f --no-hostname
```

Test local health:
```bash
curl -sS http://127.0.0.1:3000/api/health
```

Step 11 — Install and configure nginx
```bash
sudo apt install -y nginx
# create nginx webroot and copy already done static files to /var/www/infrashop
```

Place the following site file at `/etc/nginx/sites-available/infrashop` and enable it:
```nginx
server {
    listen 80;
    server_name infrashop.vectorama.fi www.infrashop.vectorama.fi;

    location /.well-known/acme-challenge/ {
        root /var/www/infrashop;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name infrashop.vectorama.fi www.infrashop.vectorama.fi;

    ssl_certificate /etc/letsencrypt/live/infrashop.vectorama.fi/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/infrashop.vectorama.fi/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /images/ {
        proxy_pass http://127.0.0.1:3000/images/;
    }

    location / {
        root /var/www/infrashop;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and reload nginx:
```bash
sudo ln -s /etc/nginx/sites-available/infrashop /etc/nginx/sites-enabled/infrashop || true
sudo nginx -t
sudo systemctl reload nginx
```

Step 12 — Obtain TLS certificates (Certbot, webroot)
```bash
sudo apt install -y certbot
# Ensure DNS for infrashop.vectorama.fi points to this server and port 80 is open
sudo certbot certonly --webroot -w /var/www/infrashop -d infrashop.vectorama.fi -d www.infrashop.vectorama.fi --email admin@vectorama.fi --agree-tos --non-interactive

# Reload nginx to pick up certs
sudo systemctl reload nginx

# Test HTTPS
curl -vk https://infrashop.vectorama.fi/api/health
```

Step 13 — Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

Step 14 — Cert renewal test
```bash
sudo certbot renew --dry-run
```

Troubleshooting notes
- If `certbot` fails, check that DNS resolves and port 80 is reachable from the internet.
- If backend cannot connect to DB, verify `/srv/infrashop/.env` values and Postgres `pg_hba.conf` (use `md5` auth for the infrashop user).
- If static files 404, ensure `/var/www/infrashop` owner is `www-data` and nginx has read access.

Security and secrets
- Treat `/srv/infrashop/.env` as sensitive. Keep file mode 600 and owned by `infrashop`.
- If you ever commit a secret by mistake, rotate it immediately (DB password, JWT_SECRET). You already have a rotate script in `scripts/rotate_secrets_ipv4.sh` — adapt for non-docker use or rotate manually.

Optional: automation script
- I can produce an idempotent `install-ubuntu.sh` that automates the above steps for you. If you want that, tell me and I will generate it for review.

That's it — after these steps your app should be reachable at https://infrashop.vectorama.fi and the backend will be running under systemd on 127.0.0.1:3000.
