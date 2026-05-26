# Project Scripts Guide

This directory contains utility scripts for InfraShop deployment, maintenance, and operations.

## Overview

```
scripts/
├── check_truncated_hashes.sh      # Verify image file integrity
├── rotate_secrets_ipv4.sh         # Rotate security secrets/keys
├── setup_prod.sh                  # Production setup automation
├── run_create_admin.sh            # Create admin user wrapper
└── guide.md                       # This file
```

## Scripts

### `setup_prod.sh` - Production Setup

Comprehensive production deployment script. Sets up entire InfraShop stack.

**Prerequisites:**
- Ubuntu/Debian system
- Sudo privileges
- Internet connectivity

**Usage:**

```bash
# Basic setup (prompts for configuration)
bash scripts/setup_prod.sh

# With environment variables (non-interactive)
ADMIN_EMAIL=admin@example.com \
ADMIN_PASS=SecurePassword123 \
DOMAIN=infrashop.example.com \
bash scripts/setup_prod.sh
```

**What It Does:**

1. **Check Prerequisites**
   - Verifies Ubuntu/Debian OS
   - Checks for required commands (git, npm, node, docker, etc.)

2. **Install Dependencies**
   - Node.js (if not installed)
   - PostgreSQL
   - Docker & Docker Compose
   - Nginx
   - SSL/TLS tools

3. **Clone/Update Repository**
   - Clones from GitHub (if needed)
   - Updates existing installation

4. **Configure Database**
   - Creates PostgreSQL user
   - Creates database
   - Runs migrations

5. **Build Application**
   - Installs npm dependencies
   - Builds frontend
   - Configures backend

6. **Set Up Services**
   - Creates systemd services
   - Configures Nginx
   - Sets up SSL certificates

7. **Create First Admin**
   - Prompts for admin email/password
   - Creates account in database

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_EMAIL` | Admin account email | (prompted) |
| `ADMIN_PASS` | Admin account password | (prompted) |
| `DOMAIN` | Domain name | (prompted) |
| `DB_USER` | PostgreSQL user | `infrashop_user` |
| `DB_PASS` | PostgreSQL password | (generated) |
| `DB_NAME` | Database name | `infrashop_db` |
| `APP_DIR` | App installation path | `/srv/infrashop` |

**Example - Automated Setup:**

```bash
export ADMIN_EMAIL="admin@company.com"
export ADMIN_PASS="InitialPassword123!"
export DOMAIN="infrashop.company.com"
export SKIP_DOCKER=1  # If you don't need Docker

sudo -E bash scripts/setup_prod.sh
```

**Verification:**

```bash
# Check services
sudo systemctl status infrashop-backend
sudo systemctl status infrashop-frontend

# Check logs
sudo journalctl -u infrashop-backend -n 20

# Test API
curl https://infrashop.example.com/api/items
```

---

### `run_create_admin.sh` - Create Admin User

Simpler wrapper for `backend/scripts/create_admin.js`.

**Usage:**

```bash
bash scripts/run_create_admin.sh

# Enter email and password when prompted
```

**Same as:**

```bash
cd backend
npm run create_admin
```

---

### `check_truncated_hashes.sh` - Image Hash Verification

Verifies integrity of uploaded images by checking file hashes.

Useful for:
- Detecting partially uploaded files
- Validating image integrity
- Finding corrupted images

**Usage:**

```bash
bash scripts/check_truncated_hashes.sh

# Outputs:
# Checking images in /srv/infrashop/backend/public/images/
# ✓ item_1.jpg (1.2 MB)
# ✗ item_2.jpg (TRUNCATED - only 256 bytes)
# ✓ item_3.png (2.5 MB)
```

**What It Does:**

1. Scans `backend/public/images/` directory
2. Checks each image file size
3. Verifies file headers (magic bytes)
4. Reports truncated/corrupted files
5. Suggests deletion of bad files

**Recovery:**

```bash
# Remove corrupted image (manually)
rm backend/public/images/item_2.jpg

# Or re-upload from user
```

---

### `rotate_secrets_ipv4.sh` - Security Key Rotation

Rotates security credentials and secrets for production hardening.

**Usage:**

```bash
bash scripts/rotate_secrets_ipv4.sh
```

**What It May Rotate:**

- JWT_SECRET
- Database passwords
- API keys
- SSL certificates
- SSH keys

**Process:**

1. Backs up current secrets
2. Generates new secrets
3. Updates configuration files
4. Restarts services
5. Tests connectivity

**Important:** 

⚠️ Keep backup of old secrets in case rollback needed!

---

## Backend Scripts

Also see `backend/scripts/guide.md` for:
- `apply_schema.js` - Database migrations
- `create_admin.js` - Create admin users

---

## Usage Examples

### Fresh Production Setup

```bash
# 1. SSH into server
ssh admin@infrashop.example.com

# 2. Clone repository
git clone https://github.com/kelemi90/infrashop_2_0.git
cd infrashop_2_0

# 3. Run setup
sudo bash scripts/setup_prod.sh
# Follow prompts for:
# - Domain name
# - Admin email
# - Admin password

# 4. Verify
curl https://infrashop.example.com

# 5. Login
# Navigate to site, login with admin credentials
```

### Upgrade Existing Installation

```bash
cd /srv/infrashop

# Pull latest changes
git pull origin main

# Install new dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Apply database migrations
cd backend && npm run migrate:apply && cd ..

# Rebuild frontend
cd frontend && npm run build && cd ..
sudo cp -r frontend/dist/* /var/www/infrashop/

# Restart services
sudo systemctl restart infrashop-backend
sudo systemctl restart infrashop-frontend

# Verify
sudo journalctl -u infrashop-backend -n 10
```

### Debug Issues

```bash
# If backend not starting:
bash scripts/run_create_admin.sh

# Check images integrity
bash scripts/check_truncated_hashes.sh

# Rotate secrets (if security concern)
bash scripts/rotate_secrets_ipv4.sh

# Check all logs
sudo journalctl -u infrashop-backend -n 50
sudo journalctl -u infrashop-frontend -n 50
sudo journalctl -u postgresql -n 50
```

### Disaster Recovery

```bash
# Backup first
tar -czf backup_$(date +%Y%m%d).tar.gz /srv/infrashop
sudo -u postgres pg_dump infrashop_db > database_backup.sql

# If things break, restore services:
sudo bash scripts/setup_prod.sh --repair

# Or manual recovery:
cd /srv/infrashop
git status
git log --oneline -5  # See what changed
git checkout main     # Reset if needed
```

---

## See Also

- `../installation/guide.md` - Automated installation
- `../backend/scripts/guide.md` - Backend-specific scripts
- `../backend/migrations/guide.md` - Database management
- `../systemd/guide.md` - Service management
- `../Makefile` - Build automation
