# Systemd Services Guide

This directory contains systemd service files for running InfraShop components as system services.

## Files

- `infrashop.service.example` - Backend service template
- `guide.md` - This file

## What is Systemd?

Systemd is the system and service manager for Linux:

- **Service management** - Start/stop/restart services
- **Auto-start** - Services start automatically on boot
- **Logging** - Unified logging via journalctl
- **Restart policy** - Auto-restart if crashed
- **Notifications** - Email alerts on failure (optional)

## Service Files

### Backend Service

**Location:** `/etc/systemd/system/infrashop-backend.service` (after installation)

**Purpose:** Runs Node.js backend API server

**Key Settings:**

```ini
[Unit]
Description=InfraShop Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/infrashop/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

### Frontend Service

**Location:** `/etc/systemd/system/infrashop-frontend.service`

**Purpose:** Serves React frontend via Nginx

---

## Common Service Commands

### Control Services

```bash
# Start service
sudo systemctl start infrashop-backend

# Stop service
sudo systemctl stop infrashop-backend

# Restart service (stop then start)
sudo systemctl restart infrashop-backend

# Reload configuration (Unix signal, no restart)
sudo systemctl reload infrashop-backend

# Check status
sudo systemctl status infrashop-backend

# Enable on boot
sudo systemctl enable infrashop-backend

# Disable on boot
sudo systemctl disable infrashop-backend
```

### Check Service Status

```bash
# Verbose status
systemctl status infrashop-backend

# Output shows:
# ✓ active (running) - Service is running
# ✗ inactive (dead) - Service is stopped
# ⚠ failed - Service crashed or failed to start
```

### View Service Logs

```bash
# Last 50 lines
sudo journalctl -u infrashop-backend -n 50

# Follow logs (like tail -f)
sudo journalctl -u infrashop-backend -f

# Last 1 hour
sudo journalctl -u infrashop-backend --since "1 hour ago"

# By date range
sudo journalctl -u infrashop-backend --since "2024-04-15" --until "2024-04-16"

# With more detail
sudo journalctl -u infrashop-backend -o verbose

# Count errors
sudo journalctl -u infrashop-backend | grep -i error | wc -l
```

---

## Service Lifecycle

### Boot Sequence

```
System boots
    ↓
systemd loads
    ↓
Enabled services start (if WantedBy=multi-user.target)
    ↓
PostgreSQL starts (dependency: postgresql.service)
    ↓
Nginx starts
    ↓
Backend starts (After=postgresql.service)
    ↓
Frontend serves files
    ↓
✓ System ready
```

### Creating/Installing Custom Service

Copy template and customize:

```bash
# Copy template
sudo cp infrashop.service.example /etc/systemd/system/infrashop-custom.service

# Edit
sudo nano /etc/systemd/system/infrashop-custom.service

# Reload systemd
sudo systemctl daemon-reload

# Start
sudo systemctl start infrashop-custom

# Enable
sudo systemctl enable infrashop-custom
```

---

## Configuration

### Service Environment Variables

Set in service file or .env:

```ini
[Service]
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your_secret_here"
EnvironmentFile=/srv/infrashop/backend/.env
```

### User/Group

Services typically run as:

```ini
User=www-data   # Or nodeapp, www, etc.
Group=www-data
```

Check who owns process:

```bash
ps aux | grep infrashop
# Shows which user running the process
```

Change permissions:

```bash
# Make user own application
sudo chown -R www-data:www-data /srv/infrashop

# Make backend .env readable by service user
sudo chmod 640 /srv/infrashop/backend/.env
```

### Restart Policy

Control restart behavior:

```ini
Restart=always              # Restart if crashes
Restart=on-failure          # Restart only on failures (nonzero exit)
Restart=on-abnormal         # Don't restart on clean exit or signals
RestartSec=10s              # Wait 10s before restart
MaxStartupTime=600          # Timeout if not started in 600s
```

---

## Troubleshooting

### Service Won't Start

**Check error:**

```bash
sudo systemctl start infrashop-backend
# If fails, see error in status

sudo systemctl status infrashop-backend
# Shows why it failed to start
```

**Common causes:**

```bash
# Port already in use
sudo lsof -i :3000

# File permissions
ls -la /srv/infrashop/backend/

# Database not running
sudo systemctl status postgresql

# See detailed logs
sudo journalctl -u infrashop-backend -o short | tail -20
```

### Service Crashes After Starting

```bash
# View recent logs
sudo journalctl -u infrashop-backend -n 100

# Check if restarting
sudo systemctl status infrashop-backend
# Shows Restart count if auto-restarting

# Disable auto-restart to prevent flapping
sudo nano /etc/systemd/system/infrashop-backend.service
# Change: Restart=on-failure to Restart=no

sudo systemctl daemon-reload
sudo systemctl start infrashop-backend
```

### Can't Find Service

```bash
# List all services
sudo systemctl list-units --type=service

# Reload after adding new service file
sudo systemctl daemon-reload

# Check if enabled
sudo systemctl is-enabled infrashop-backend
```

### High Memory Usage

```bash
# Monitor memory
sudo systemctl status infrashop-backend
# Shows memory usage

# Limit memory (in service file)
[Service]
MemoryLimit=512M
```

---

## Monitoring & Health Checks

### Health Check (Simple)

```bash
# Can you reach the API?
curl -s http://localhost:3000/api/items > /dev/null && echo "OK" || echo "FAIL"

# Add to systemd as ExecStartPost to verify startup
```

### systemd Monitoring

```bash
# Services status
systemctl list-units --type=service --state=running

# Failed services
systemctl list-units --type=service --state=failed

# Restart count
systemctl show infrashop-backend | grep NRestarts
```

### Automated Alerts (Optional)

Monitor service and send alerts:

```bash
#!/bin/bash
# ~/.local/bin/check_services.sh

if ! systemctl is-active --quiet infrashop-backend; then
    echo "Backend crashed - restarting..."
    sudo systemctl restart infrashop-backend
    # Send alert email
    echo "Backend restarted!" | mail -s "Infrashop Alert" admin@example.com
fi
```

Add to crontab:

```bash
# Check every 5 minutes
crontab -e
# Add: */5 * * * * bash ~/.local/bin/check_services.sh
```

---

## Performance Tips

### Optimize Startup

```ini
# Tell systemd service can signal readiness
Type=notify

# Faster startup (don't wait for all units)
After=network-online.target
Wants=network-online.target
```

### Improve Logging

```bash
# Limit journalctl storage
sudo journalctl --vacuum-time=30d

# Per-service log size
sudo journalctl -u infrashop-backend --disk-usage
```

### Resource Limits

```ini
[Service]
# CPU
CPUQuota=80%
# Memory  
MemoryLimit=1G
# File descriptors
LimitNOFILE=65535
# Processes
LimitNPROC=4096
```

---

## Systemd Timers (Scheduled Tasks)

Run scripts on schedule instead of cron:

```ini
# /etc/systemd/system/backup-infrashop.timer
[Unit]
Description=Daily Backup of InfraShop

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00  # 2 AM daily
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup-infrashop.service
[Unit]
Description=Backup InfraShop Database

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup-infrashop.sh
User=root
```

Enable and use:

```bash
sudo systemctl enable backup-infrashop.timer
sudo systemctl start backup-infrashop.timer

# View timer status
systemctl list-timers

# View last run
sudo journalctl -u backup-infrashop.service -n 5
```

---

## Debugging

### Enable Debug Logging

```bash
# Start service with debug output
sudo SYSTEMD_LOG_LEVEL=debug systemctl start infrashop-backend

# Or modify service file
[Service]
Environment="DEBUG=*"
```

### Trace Service Startup

```bash
# Show what's happening
sudo strace -e trace=process systemctl start infrashop-backend
```

### See All Service Processes

```bash
# Show all processes under service
systemctl show -p MainPID infrashop-backend
ps -ef | grep infrashop
```

---

## See Also

- `infrashop.service.example` - Service file template
- `../nginx/guide.md` - Nginx service management
- `../scripts/guide.md` - Deployment scripts
- `../backend/guide.md` - Backend configuration
- [systemd Documentation](https://systemd.io/) - Official docs
