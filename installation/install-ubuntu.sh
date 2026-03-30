#!/usr/bin/env bash
set -euo pipefail

# Infrashop installation helper for Ubuntu/Debian
# Idempotent where practical. Run on the target server as a user with sudo.

REPO_URL="https://github.com/kelemi90/infrashop_2_0.git"
APP_DIR="/srv/infrashop"
WEBROOT="/var/www/infrashop"
SERVICE_FILE="/etc/systemd/system/infrashop-backend.service"

function info { echo -e "\e[34m[INFO]\e[0m $*"; }
function warn { echo -e "\e[33m[WARN]\e[0m $*"; }
function die  { echo -e "\e[31m[ERR]\e[0m $*"; exit 1; }

if [ "$EUID" -ne 0 ]; then
  die "This script must be run with sudo or as root. Re-run with sudo."
fi

# CLI flags: allow fully non-interactive provisioning
NONINTERACTIVE=0
DOMAIN="infrashop.vectorama.fi"
ADMIN_EMAIL=""
ADMIN_PASS=""
DB_PASSWORD=""
JWT_SECRET=""
RESTORE_DUMP=0
ASSUME_YES=0

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  --domain <domain>           Domain to configure (default: ${DOMAIN})
  --admin-email <email>       Admin email for certbot (default: admin@<domain>)
  --db-password <password>    Postgres password for infrashop user (generated if omitted)
  --jwt-secret <secret>       JWT secret (generated if omitted)
  --restore-dump              If present, will attempt to restore /srv/infrashop/db_backup.dump
  --yes                       Assume yes to all prompts (non-interactive)
  --non-interactive           Fully non-interactive (requires --domain and --admin-email)
  -h, --help                  Show this help
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"; shift 2;;
    --admin-email)
      ADMIN_EMAIL="$2"; shift 2;;
    --admin-password)
      ADMIN_PASS="$2"; shift 2;;
    --db-password)
      DB_PASSWORD="$2"; shift 2;;
    --jwt-secret)
      JWT_SECRET="$2"; shift 2;;
    --restore-dump)
      RESTORE_DUMP=1; shift;;
    --yes)
      ASSUME_YES=1; shift;;
    --non-interactive)
      NONINTERACTIVE=1; ASSUME_YES=1; shift;;
    -h|--help)
      usage;;
    *)
      die "Unknown option: $1";;
  esac
done

# Derive defaults when not provided
if [ -z "$ADMIN_EMAIL" ]; then
  ADMIN_EMAIL="admin@${DOMAIN}"
fi

if [ $NONINTERACTIVE -eq 1 ]; then
  # In non-interactive mode, require domain and admin email
  if [ -z "$DOMAIN" ] || [ -z "$ADMIN_EMAIL" ]; then
    die "--non-interactive requires --domain and --admin-email"
  fi
fi

# Generate secrets if omitted
if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  info "Generated DB password"
fi

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(head -c 32 /dev/urandom | base64)
  info "Generated JWT secret"
fi

# If not non-interactive and not assume-yes, prompt for restore option
if [ $NONINTERACTIVE -eq 0 ] && [ $ASSUME_YES -eq 0 ]; then
  read -rp "Do you want to restore a DB dump if present under $APP_DIR/db_backup.dump? [y/N]: " RESP
  RESP=${RESP:-N}
  if [[ "$RESP" =~ ^[Yy]$ ]]; then
    RESTORE_DUMP=1
  else
    RESTORE_DUMP=0
  fi
fi

apt_update() {
  info "Updating apt"
  apt-get update -y
}

apt_install() {
  packages=(git curl build-essential ufw ca-certificates lsb-release gnupg)
  info "Installing basic packages: ${packages[*]}"
  apt-get install -y "${packages[@]}"
}

install_node() {
  if command -v node >/dev/null 2>&1 && [[ $(node -v) == v20* ]]; then
    info "Node 20 already installed ($(node -v))"
    return
  fi
  info "Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

install_postgres() {
  if systemctl is-active --quiet postgresql; then
    info "Postgres appears installed and running"
    return
  fi
  info "Installing PostgreSQL 15"
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg
  echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
  apt-get update -y
  apt-get install -y postgresql-15
  systemctl enable --now postgresql
}

create_db_user() {
  # create role if not exists
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='infrashop'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE ROLE infrashop WITH LOGIN PASSWORD '${DB_PASSWORD}';"
  # create db if not exists
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='infrashop'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE infrashop OWNER infrashop;"
  systemctl restart postgresql
}

create_app_user_and_clone() {
  if id -u infrashop >/dev/null 2>&1; then
    info "User 'infrashop' already exists"
  else
    info "Creating system user 'infrashop'"
    useradd -m -s /bin/bash infrashop || true
  fi

  if [ -d "$APP_DIR" ] && [ -d "$APP_DIR/.git" ]; then
    info "App dir exists, fetching latest"
    sudo -u infrashop git -C "$APP_DIR" pull || true
  else
    info "Cloning repository into $APP_DIR"
    mkdir -p "$APP_DIR"
    chown infrashop:infrashop "$APP_DIR"
    sudo -u infrashop git clone "$REPO_URL" "$APP_DIR"
  fi
}

create_env() {
  info "Creating .env at $APP_DIR/.env"
  cat > /tmp/infrashop.env <<EOF
POSTGRES_DB=infrashop
POSTGRES_USER=infrashop
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://infrashop:${DB_PASSWORD}@127.0.0.1:5432/infrashop
JWT_SECRET=${JWT_SECRET}
PORT=3000
NODE_ENV=production
EOF
  mv /tmp/infrashop.env "$APP_DIR/.env"
  chown infrashop:infrashop "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
}

apply_schema_or_restore() {
  if [[ "$RESTORE_DUMP" =~ ^[Yy]$ ]] && [ -f "$APP_DIR/db_backup.dump" ]; then
    info "Restoring dump from $APP_DIR/db_backup.dump"
    sudo -u postgres pg_restore -d infrashop "$APP_DIR/db_backup.dump"
  else
    info "Applying schema.sql from repo"
    sudo -u infrashop bash -lc "cd $APP_DIR/backend && npm ci --no-audit --no-fund && export DATABASE_URL=postgresql://infrashop:${DB_PASSWORD}@127.0.0.1:5432/infrashop && npm run migrate:apply"
  fi
}

create_admin_user() {
  if [ $NONINTERACTIVE -eq 1 ] || [ $ASSUME_YES -eq 1 ]; then
    info "Creating admin user non-interactively"
    admin_email=${ADMIN_EMAIL:-admin@${DOMAIN}}
    admin_pass=${ADMIN_PASS:-}
    if [ -z "$admin_pass" ]; then
      admin_pass=$(head -c 20 /dev/urandom | base64)
      info "Generated admin password: $admin_pass"
    fi
    sudo -u infrashop bash -lc "cd $APP_DIR/backend && export DATABASE_URL=postgresql://infrashop:${DB_PASSWORD}@127.0.0.1:5432/infrashop && export ADMIN_EMAIL=${admin_email} ADMIN_PASSWORD='${admin_pass}' ADMIN_DISPLAY_NAME='Admin' && npm run create_admin"
    return
  fi

  read -rp "Create initial admin user now? [Y/n]: " create_admin
  create_admin=${create_admin:-Y}
  if [[ "$create_admin" =~ ^[Yy]$ ]]; then
    read -rp "Admin email (default: admin@${DOMAIN}): " admin_email
    admin_email=${admin_email:-admin@${DOMAIN}}
    read -rp "Admin password (leave empty to auto-generate): " admin_pass
    if [ -z "$admin_pass" ]; then
      admin_pass=$(head -c 20 /dev/urandom | base64)
      info "Generated admin password: $admin_pass"
    fi
    sudo -u infrashop bash -lc "cd $APP_DIR/backend && export DATABASE_URL=postgresql://infrashop:${DB_PASSWORD}@127.0.0.1:5432/infrashop && export ADMIN_EMAIL=${admin_email} ADMIN_PASSWORD='${admin_pass}' ADMIN_DISPLAY_NAME='Admin' && npm run create_admin"
  fi
}

install_backend_and_build_frontend() {
  info "Installing backend production dependencies"
  sudo -u infrashop bash -lc "cd $APP_DIR/backend && npm ci --production --no-audit --no-fund"

  info "Building frontend"
  sudo -u infrashop bash -lc "cd $APP_DIR/frontend && npm ci --no-audit --no-fund && npm run build"
  mkdir -p "$WEBROOT"
  rm -rf "$WEBROOT"/* || true
  cp -r "$APP_DIR/frontend/dist/"* "$WEBROOT/"
  chown -R www-data:www-data "$WEBROOT"
}

create_systemd_service() {
  if [ -f "$SERVICE_FILE" ]; then
    info "Systemd service already exists: $SERVICE_FILE"
    return
  fi
  info "Creating systemd service $SERVICE_FILE"
  cat > "$SERVICE_FILE" <<'EOF'
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
EOF
  systemctl daemon-reload
  systemctl enable --now infrashop-backend.service
}

setup_nginx_site() {
  info "Configuring nginx site for $DOMAIN"
  apt-get install -y nginx
  mkdir -p "$WEBROOT"
  cat > /etc/nginx/sites-available/infrashop <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /images/ {
        proxy_pass http://127.0.0.1:3000/images/;
    }

    location / {
        root ${WEBROOT};
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/infrashop /etc/nginx/sites-enabled/infrashop
  nginx -t
  systemctl reload nginx
}

obtain_certbot() {
  read -rp "Attempt to obtain Let's Encrypt certs now using Certbot webroot? [Y/n]: " do_cert
  do_cert=${do_cert:-Y}
  if [[ "$do_cert" =~ ^[Yy]$ ]]; then
    apt-get install -y certbot
    certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" -d "www.$DOMAIN" --email "$ADMIN_EMAIL" --agree-tos --non-interactive || {
      warn "certbot failed — check DNS and port 80 accessibility and run certbot manually later"
      return
    }
    systemctl reload nginx
    info "Certificates obtained and nginx reloaded"
  else
    info "Skipping certbot. Run: sudo certbot certonly --webroot -w $WEBROOT -d $DOMAIN -d www.$DOMAIN"
  fi
}

enable_firewall() {
  if ufw status | grep -q inactive; then
    info "Enabling ufw and allowing SSH + Nginx Full"
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
  else
    info "ufw already active; ensure ports 80 and 443 are allowed"
    ufw allow 'Nginx Full' || true
  fi
}

main() {
  apt_update
  apt_install
  install_node
  install_postgres
  create_db_user
  create_app_user_and_clone
  create_env
  apply_schema_or_restore
  create_admin_user
  install_backend_and_build_frontend
  create_systemd_service
  setup_nginx_site
  obtain_certbot
  enable_firewall
  info "Installation finished. Check systemd logs and nginx; visit https://$DOMAIN when DNS and certs are ready."
}

main "$@"
