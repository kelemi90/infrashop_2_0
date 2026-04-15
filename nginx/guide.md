# Nginx Configuration Guide

This directory contains Nginx web server configuration for InfraShop, including reverse proxy setup, SSL/TLS, and static file serving.

## Files

- `infrashop.conf` - Main Nginx configuration (active)
- `default.conf` - Frontend-specific configuration (in frontend/)
- `README.md` - Configuration notes
- `guide.md` - This file
- `html/` - Static HTML files

## Configuration Purpose

Nginx serves two key roles in InfraShop:

1. **Reverse Proxy** - Routes API requests to Node.js backend
2. **Static File Server** - Serves React frontend and images

## Main Configuration

### Location

After installation:
```
/etc/nginx/sites-available/infrashop.conf
/etc/nginx/sites-enabled/infrashop.conf  # Symlink to above
```

### Key Features

- HTTPS/SSL support (Let's Encrypt)
- HTTP to HTTPS redirect
- Gzip compression
- Cache headers
- CORS configuration

## Configuration Sections

### 1. Upstream Backend

```nginx
upstream infrashop_backend {
    server localhost:3000;
    keepalive 32;
}
```

Points to Node.js backend running on port 3000.

### 2. HTTP to HTTPS Redirect

```nginx
server {
    listen 80;
    server_name infrashop.example.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

Automatically redirects insecure HTTP to HTTPS.

### 3. HTTPS Server Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name infrashop.example.com;
    
    ssl_certificate /etc/letsencrypt/live/infrashop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/infrashop.example.com/privkey.pem;
}
```

Main HTTPS listener with SSL certificate.

### 4. Backend Proxy

Routes `/api/*` requests to Node.js:

```nginx
location /api/ {
    proxy_pass http://infrashop_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 5. Frontend / Static Files

```nginx
location / {
    root /var/www/infrashop;
    try_files $uri $uri/ /index.html;
    index index.html;
}
```

Serves React app from `/var/www/infrashop/dist/`.

Serves:
- Static assets (JS, CSS, images)
- Falls back to `index.html` for SPA routing

### 6. Image Uploads

```nginx
location /images/ {
    alias /srv/infrashop/backend/public/images/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

Serves uploaded item images with caching.

## Common Tasks

### Check Configuration Syntax

```bash
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful.
```

Always run after editing!

### Reload Configuration

```bash
# Reload (connections stay open)
sudo systemctl reload nginx

# Restart (closes all connections)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### View Active Configuration

```bash
# Show main config
sudo cat /etc/nginx/sites-enabled/infrashop.conf

# Show all included files
sudo nginx -T | head -100

# Check for errors
sudo nginx -T 2>&1 | grep error
```

### Test Specific Configuration

```bash
# Test before deployment
sudo nginx -t -c /etc/nginx/sites-available/infrashop.conf
```

## Management

### Enable Site

```bash
# If not already symlinked
sudo ln -s /etc/nginx/sites-available/infrashop.conf \
           /etc/nginx/sites-enabled/infrashop.conf

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### Disable Site

```bash
sudo rm /etc/nginx/sites-enabled/infrashop.conf
sudo systemctl reload nginx
```

### Service Commands

```bash
# Start
sudo systemctl start nginx

# Stop
sudo systemctl stop nginx

# Restart (closes connections)
sudo systemctl restart nginx

# Reload (keeps connections)
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx

# Disable on boot
sudo systemctl disable nginx

# Status
sudo systemctl status nginx
```

## SSL/TLS Certificate

### Let's Encrypt Setup

Installed automatically by `installation/install-ubuntu.sh`:

```bash
# Check certificate
sudo openssl x509 -text -noout -in /etc/letsencrypt/live/infrashop.example.com/fullchain.pem

# Certificate location
/etc/letsencrypt/live/infrashop.example.com/
├── fullchain.pem     # Full chain
├── privkey.pem       # Private key
├── cert.pem          # Certificate only
└── chain.pem         # Chain only
```

### Renew Certificate

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Automatic (runs daily via cron)
sudo systemctl status certbot.timer
```

### Manual Certificate Installation

If using custom certificate:

```bash
sudo cp /path/to/cert.pem /etc/nginx/ssl/
sudo cp /path/to/key.pem /etc/nginx/ssl/

# Update config
sudo nano /etc/nginx/sites-available/infrashop.conf
# Update ssl_certificate and ssl_certificate_key paths

sudo nginx -t && sudo systemctl reload nginx
```

## Logs

### Access Logs

```bash
# Real-time access log
sudo tail -f /var/log/nginx/access.log

# Count requests
sudo tail -100 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn

# Show slow requests (>1s)
sudo grep -E " [1-9][0-9]{3,} " /var/log/nginx/access.log
```

### Error Logs

```bash
# View errors
sudo tail -f /var/log/nginx/error.log

# Count error types
sudo grep -oE '[a-zA-Z ]+(errno|error|failed)' /var/log/nginx/error.log | sort | uniq -c | sort -rn
```

## Troubleshooting

### "Connection refused" on `/api/*`

**Issue**: Backend not running or wrong port

**Solution**:

```bash
# Check if Node.js backend is running
sudo lsof -i :3000

# Check backend status
sudo systemctl status infrashop-backend

# Check Nginx upstream
sudo nginx -T | grep upstream

# Test backend locally
curl http://localhost:3000/health
```

### "502 Bad Gateway"

**Cause**: Backend crashed or unreachable

**Solution**:

```bash
# Check backend logs
sudo journalctl -u infrashop-backend -n 50

# Restart backend
sudo systemctl restart infrashop-backend

# Check if port is available
sudo lsof -i :3000
```

### "File not found" for `/`

**Cause**: Frontend files not deployed

**Solution**:

```bash
# Check if files exist
ls -la /var/www/infrashop/dist/

# Rebuild frontend
cd /srv/infrashop/frontend
npm run build

# Copy to web root
sudo cp -r dist/* /var/www/infrashop/

# Check permissions
sudo chown -R www-data:www-data /var/www/infrashop/
```

### SSL Certificate Error

**Cause**: Certificate not found or expired

**Solution**:

```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/infrashop.example.com/

# Check expiration
sudo openssl x509 -text -noout -in /etc/letsencrypt/live/infrashop.example.com/cert.pem | grep -E "(Not Before|Not After)"

# Renew certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Port Already in Use

**Cause**: Another service using port 80/443

**Solution**:

```bash
# Find what's using the port
sudo lsof -i :80   # Port 80
sudo lsof -i :443  # Port 443

# Kill process (or stop the service)
sudo kill -9 <PID>

# Or stop other web server
sudo systemctl stop apache2
```

### High Memory or CPU Usage

**Cause**: Too many workers or slow requests

**Solution**:

```bash
# Check number of worker processes
grep worker_processes /etc/nginx/nginx.conf

# Reduce if needed
sudo nano /etc/nginx/nginx.conf
# Set: worker_processes 2;  (match CPU cores)

sudo nginx -t && sudo systemctl reload nginx
```

## Performance Tuning

### Enable Caching

Already configured in infrashop.conf:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Gzip Compression

```nginx
gzip on;
gzip_types text/html text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### Connection Pooling

For backend proxy:

```nginx
upstream infrashop_backend {
    server localhost:3000;
    keepalive 32;  # Connection pooling
}
```

### Limits

Protect against abuse:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20;
}
```

## Security

### Headers

Secure headers already in infrashop.conf:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### HTTPS Only

```nginx
# Force HTTPS on all requests
location / {
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
}
```

### Disable Directory Listing

```nginx
location / {
    autoindex off;  # Don't list directory contents
}
```

## Monitoring

### Real-Time Monitoring

```bash
# Number of connections
watch -n 1 'netstat -an | grep :80 | wc -l'

# Active processes
watch -n 1 'pgrep -fa nginx'

# Traffic
sudo iftop -i eth0
```

### Prometheus Metrics

Enable metrics module for monitoring:

```bash
# Check if built with ngx_http_stub_status_module
sudo nginx -V 2>&1 | grep stub_status
```

## See Also

- `infrashop.conf` - Main configuration file
- `default.conf` - Frontend configuration
- `../installation/guide.md` - Installation guide
- `../systemd/guide.md` - Service management
- `../README.md` - Project overview
