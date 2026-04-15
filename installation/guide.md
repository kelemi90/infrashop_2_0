# Installation Guide

This directory contains automated scripts and documentation for deploying InfraShop on Ubuntu/Debian servers.

## Files

- `install-ubuntu.sh` - Main installation script (interactive, idempotent)
- `README.md` - Ubuntu-specific installation notes
- `guide.md` - This file

## Quick Start

For a standard Ubuntu 20.04+ server:

```bash
# Download and run installation script
sudo bash installation/install-ubuntu.sh
```

The script will:
1. Check prerequisites
2. Install system packages (Node.js, PostgreSQL, Docker, etc.)
3. Clone/update InfraShop repository
4. Configure services
5. Set up SSL/TLS certificates
6. Create admin account

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04, 22.04 (or Debian 11+)
- **CPU**: 2+ cores
- **RAM**: 2+ GB
- **Storage**: 20+ GB
- **Network**: Public IP or domain name

### Required Access

- **SSH access** to server (as root or sudoers)
- **Internet** connection for package downloads
- **Domain name** (for HTTPS/SSL)

## Installation Methods

### 1. Automated Installation (Recommended)

```bash
# Interactive setup - you'll be prompted for domain, email, etc.
sudo bash installation/install-ubuntu.sh
```

**Process:**
1. Prompts for configuration (domain, email, admin password)
2. Installs all dependencies
3. Configures Nginx
4. Sets up SSL (Let's Encrypt)
5. Starts services
6. Creates admin user

**Reusable:** Run multiple times safely (idempotent)

### 2. Manual Installation

```bash
# If you prefer step-by-step control
sudo bash installation/install-ubuntu.sh --dry-run

# Then execute each step manually
```

### 3. Docker Setup

For containerized deployment:

```bash
docker-compose up -d
```

See `../docker-compose.yml` for configuration.

### 4. Ansible Automation

For multiple servers:

```bash
ansible-playbook -i inventory.ini ../ansible/playbook.yml
```

See `../ansible/guide.md` for details.

## Configuration

### Domain Name

The script will ask for your domain:

```
Domain to configure (default: infrashop.vectorama.fi): myserver.example.com
```

This is used for:
- Nginx virtual host
- SSL certificate
- API endpoint
- Email notifications

### Email (For SSL Certificates)

Used by Let's Encrypt for certificate registration:

```
Email for SSL certificate (required): admin@example.com
```

### Admin User

After installation completes, you'll create the first admin account:

```
Admin email: admin@myserver.example.com
Admin password: [hidden input]
```

Save these credentials securely!

## What Gets Installed

### System Packages
- Node.js (via NVM)
- PostgreSQL (database)
- Nginx (web server)
- Docker & Docker Compose
- Git
- Build tools (gcc, python3-dev, etc.)

### Application Services
- **Backend API** - Node.js Express server
- **Frontend** - React/Vite application
- **Database** - PostgreSQL

### Configuration
- **SSL Certificates** - Auto-configured with Let's Encrypt
- **Nginx** - Reverse proxy, static file serving
- **systemd services** - Auto-start on system reboot
- **Firewall** - UFW configuration (if enabled)

## Post-Installation

### 1. Verify Installation

```bash
# Check services status
sudo systemctl status infrashop-backend
sudo systemctl status infrashop-frontend
sudo systemctl status postgresql

# Check logs
sudo journalctl -u infrashop-backend -n 50
```

### 2. Access Application

Open in browser:
```
https://yourserver.example.com
```

Or navigate to your domain configured during installation.

### 3. First Login

Use the admin credentials created during installation:
```
Email: admin@myserver.example.com
Password: [as entered during setup]
```

### 4. Configure Firewall

The script should configure UFW:

```bash
# Check firewall status
sudo ufw status

# If not enabled, enable it
sudo ufw enable

# The script opens: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 5. Set Up Email Notifications (Optional)

Configure SMTP in backend `.env`:

```bash
sudo nano /srv/infrashop/backend/.env

# Add:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Troubleshooting

### "Permission denied" or "sudo required"

Run with sudo:
```bash
sudo bash installation/install-ubuntu.sh
```

### "Port 80/443 already in use"

Check what's using those ports:

```bash
sudo lsof -i :80  # Shows process using port 80
sudo lsof -i :443 # Shows process using port 443

# If Apache is running and you want Nginx instead
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### "SSL certificate error"

Let's Encrypt certificate generation failed. Verify:

```bash
# Domain resolves to server IP
nslookup yourserver.example.com

# Ports 80/443 are accessible
curl http://yourserver.example.com

# Then retry: run the install script again
sudo bash installation/install-ubuntu.sh
```

### "Database connection failed"

PostgreSQL might not be running:

```bash
# Check status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Check logs
sudo journalctl -u postgresql -n 50
```

### "Backend service won't start"

Check system resources:

```bash
# Memory
free -h

# Disk space
df -h

# See backend logs
sudo journalctl -u infrashop-backend -n 100
```

## Updating InfraShop

After installation to update to latest version:

```bash
# Navigate to repo
cd /srv/infrashop

# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Apply any new migrations
cd backend && npm run migrate:apply && cd ..

# Restart services
sudo systemctl restart infrashop-backend
sudo systemctl restart infrashop-frontend
```

## Backing Up

### Database Backup

```bash
# Backup PostgreSQL database
sudo -u postgres pg_dump infrashop_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo -u postgres psql infrashop_db < backup_20240415_143022.sql
```

### Application Backup

```bash
# Backup entire application directory
tar -czf infrashop_backup_$(date +%Y%m%d).tar.gz /srv/infrashop

# Backup just uploaded images
tar -czf images_backup_$(date +%Y%m%d).tar.gz /srv/infrashop/backend/public/images
```

### Scheduled Backups

```bash
# Add to crontab for daily backups at 2 AM
sudo crontab -e

# Add line:
0 2 * * * sudo -u postgres pg_dump infrashop_db | gzip > /backups/infrashop_$(date +\%Y\%m\%d).sql.gz
```

## SSL Certificate Renewal

Let's Encrypt certificates expire after 90 days. Renewal is automatic:

```bash
# Check certificate expiration
sudo openssl x509 -text -noout -in /etc/letsencrypt/live/yourserver.example.com/cert.pem | grep -A 2 "Validity"

# Renew manually if needed
sudo certbot renew --force-renewal
```

## Security Hardening

After installation, consider:

### 1. Update SSH Port (Optional)

```bash
sudo nano /etc/ssh/sshd_config
# Change Port 22 to something else like Port 2222
sudo systemctl restart ssh
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
sudo systemctl restart ssh
```

### 3. Install Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 4. Rotate Secrets

Change JWT_SECRET periodically:

```bash
cd /srv/infrashop
# Generate new secret
openssl rand -base64 32

# Update backend/.env with new JWT_SECRET
sudo systemctl restart infrashop-backend
```

## Performance Tuning

### PostgreSQL

```bash
# For small server (2GB RAM), edit postgresql.conf:
sudo nano /etc/postgresql/14/main/postgresql.conf

# Suggested settings:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 16MB

sudo systemctl restart postgresql
```

### Nginx

Already optimized in script. Check configuration:

```bash
sudo cat /etc/nginx/sites-enabled/infrashop.conf
```

### Node.js

Set memory limits:

```bash
# Edit systemd service
sudo nano /etc/systemd/system/infrashop-backend.service

# Add:
# Environment="NODE_OPTIONS=--max-old-space-size=1024"

sudo systemctl daemon-reload
sudo systemctl restart infrashop-backend
```

## Logs

### View Logs

```bash
# Backend
sudo journalctl -u infrashop-backend -f

# Frontend
sudo journalctl -u infrashop-frontend -f

# Database
sudo journalctl -u postgresql -f

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Uninstall

To remove InfraShop (careful!):

```bash
# Stop services
sudo systemctl stop infrashop-backend
sudo systemctl stop infrashop-frontend
sudo systemctl disable infrashop-backend
sudo systemctl disable infrashop-frontend

# Remove service files
sudo rm /etc/systemd/system/infrashop-backend.service
sudo rm /etc/systemd/system/infrashop-frontend.service

# Remove application (this deletes all files!)
sudo rm -rf /srv/infrashop

# Remove certificate
sudo rm -rf /etc/letsencrypt/live/yourserver.example.com

# Remove Nginx config
sudo rm /etc/nginx/sites-enabled/infrashop.conf
sudo nginx -s reload
```

## See Also

- `../INSTALL_SERVER.md` - General server setup
- `../ansible/guide.md` - Ansible deployment
- `../systemd/guide.md` - Systemd service details
- `README.md` - Ubuntu-specific notes
