# Installing Infrashop to a Linux server (step-by-step)

This guide walks through a pragmatic, repeatable server install using Docker Compose. It assumes a modern Debian/Ubuntu (or similar) server. Adjust package manager commands for other distros.

Summary of what you'll do
- Install Docker and the `docker compose` plugin
- Clone this repository to the server
- Configure environment (JWT secret, optional DATABASE_URL)
- Run `scripts/setup_prod.sh` to bootstrap services, import data, populate image volume and create an admin user
- Configure TLS (optional) and persistent service (systemd)

IMPORTANT: this guide runs commands that require sudo/root privileges. Always review scripts before running them on a production server.

1) Server prerequisites

- OS: Debian/Ubuntu/CentOS/RHEL (this guide uses apt examples)
- CPU/RAM: small test server is fine; production should use appropriate sizing
- Disk: ensure you have disk space for images, DB volume and backups
- Open ports: 80 (HTTP) and 443 (HTTPS) to the host; 5432 (Postgres) is only needed if you expose it (not recommended)

2) Install Docker & Docker Compose (plugin)

Run the distro-appropriate install. On Debian/Ubuntu (recommended):

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# (Optional) allow your admin user to run docker without sudo:
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
```

3) Prepare the server and clone repository

```bash
# choose an install path
sudo mkdir -p /srv/infrashop
sudo chown $USER:$USER /srv/infrashop
cd /srv/infrashop

# clone repo
git clone https://github.com/kelemi90/infrashop_2_0.git .

# make helper scripts executable
chmod +x scripts/*.sh
```

4) Environment and secrets

- `JWT_SECRET`: set a random secret for JWTs
- `DATABASE_URL` (optional): if you want to use an external Postgres instance, set this; otherwise Compose will start a Postgres container

Create a `.env` file in the repo root or export vars in the shell before running the setup script:

```bash
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
# Optional: DATABASE_URL=postgres://user:pass@host:5432/infrashop
EOF

export $(cat .env | xargs)
```

5) Bootstrap the stack and run setup script

The repository includes `scripts/setup_prod.sh`, which:
- runs `docker compose up -d --build`
- waits for Postgres
- imports schema and sample data if DB is empty
- creates or promotes an admin user (calls our safe wrapper to generate bcrypt)
- detects and populates the named image volume from `backend/public/images` and optionally creates a backup in `scripts/backup/`

Run a dry-run first to see what will happen:

```bash
./scripts/setup_prod.sh --dry-run
```

Then run the full setup (non-interactive example):

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASS='S3cretP@ss' ADMIN_NAME='Site Admin' ./scripts/setup_prod.sh
```

Notes:
- The script will look for Node inside the backend container; if not present it runs the admin creation helper inside a temporary Node container (no dev deps required in production image).
- If you want to skip the image volume backup step used by the script, pass `--no-backup`.

6) Verify services

```bash
docker compose ps
docker compose logs -f backend nginx

# Verify frontend via nginx
curl -I http://localhost/

# Test login
curl -i -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"S3cretP@ss"}'
```

7) TLS (Let's Encrypt) and nginx

This repo includes an `nginx` container configured to proxy `/api` and `/images` to the backend and serve the frontend. To add TLS:

- Place your cert and key somewhere on the host (or use Certbot to obtain certs) and update `nginx/infrashop.conf` or mount them into the nginx container via `docker-compose.yml`.
- Alternatively, run a small reverse-proxy (Traefik or Caddy) in front of this stack and let it manage certificates automatically.

8) Persistence and backups

- Database: Postgres data is stored in a named Docker volume created by Compose. Backup regularly with `pg_dump` run inside the `db` container:

```bash
docker compose exec db pg_dump -U infrashop -Fc infrashop -f /tmp/db_backup.dump
docker cp "$(docker compose ps -q db)":/tmp/db_backup.dump ./db_backup.dump
```

- Images: `scripts/setup_prod.sh` creates tarball backups of the images volume before populating it. You should copy these tarballs off the server to long-term storage.

9) Make the stack start on boot (systemd)

Create a simple systemd unit that brings up the stack on boot. Adjust `WorkingDirectory` for your install path.

`/etc/systemd/system/infrashop.service`:

```ini
[Unit]
Description=Infrashop Docker Compose
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/srv/infrashop
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now infrashop.service
```

10) Maintenance tips

- To update the app: pull latest, run `docker compose build --no-cache`, then `docker compose up -d`.
- Keep `JWT_SECRET` stable across upgrades (store in `.env`).
- Monitor `scripts/backup/` and rotate backups regularly.
- Run `./scripts/check_truncated_hashes.sh` periodically if you suspect DB migrations or scripts may have written corrupted password hashes in the past.

11) Troubleshooting

- If `docker compose ps` shows containers failing, inspect logs:
  - `docker compose logs backend --tail 200`
  - `docker compose logs nginx --tail 200`
- If login fails with 401, check the `users` table and ensure `password_hash` length is a full bcrypt hash (60 chars):

```bash
docker compose exec db psql -U infrashop -d infrashop -c "SELECT id,email,length(password_hash) FROM users;"
```

- If there are socket permission issues on remote hosts when using `docker cp` or similar, either run the commands with `sudo` or add your user to the `docker` group and re-login.

12) Security notes

- Do not expose Postgres (`5432`) publicly; keep it internal to the host or a private network.
- Use strong `ADMIN_PASS` and a secure `JWT_SECRET`.
- Lock down ports with your firewall (ufw/iptables) allowing only 80/443 from the internet and SSH from trusted IPs.

13) Optional: CI / monitoring

- Add the GitHub Actions workflow `.github/workflows/npm-audit.yml` (present in this repo) to block PRs that introduce moderate-or-higher npm vulnerabilities.
- Integrate a monitoring or logging stack (Prometheus/Alertmanager, Grafana, or a hosted service) for uptime and error tracking.

If you want, I can also:
- produce a tested systemd unit that runs `docker compose` under a dedicated service user,
- add a small Ansible playbook to make the whole install fully automated,
- or commit these docs into a `docs/` folder in the repo and open a PR.

Happy to iterate on any of the sections above and tailor them to your target server. 
