NGINX reverse proxy for multiple sites

This repo ships a simple nginx configuration that demonstrates how to host multiple sites on the same public IP using hostname-based routing (virtual hosts). The proxy inspects the Host header (and SNI for TLS) and forwards traffic to different upstreams (containers in the same Docker Compose network).

What we changed
- `nginx/infrashop.conf` now contains:
  - a default server that rejects unknown hosts
  - a `server` block for `infrashop.example.com` proxying to `frontend` and `backend` containers
  - a `server` block for `other.example.com` proxying to an `other` container on port 8080

Next steps to make this work in your environment
1. DNS
   - Create A records for `infrashop.example.com` and `other.example.com` that point to your server's public IP.

2. Containers / services
   - `frontend` and `backend` containers already exist in `docker-compose.yml`.
   - If you host another site, add a service named `other` (or change the upstream in `infrashop.conf`). Example service (add to `docker-compose.yml`):

```yaml
  other:
    image: nginx:stable
    volumes:
      - ./other-site:/usr/share/nginx/html:ro
    networks:
      - infranet
```

3. TLS (recommended)
   - Use Certbot to obtain certificates and add `listen 443 ssl` server blocks.
   - Or use the nginx plugin: `sudo certbot --nginx -d infrashop.example.com -d other.example.com`.

4. Deploy
   - Reload nginx: `docker compose restart nginx` or `docker compose up -d --build nginx`
   - Verify with curl from your client:
     - `curl -I -H "Host: infrashop.example.com" http://<your-ip>`
     - `curl -I -H "Host: other.example.com" http://<your-ip>`

5. Troubleshooting
   - `docker compose logs --no-color --tail=200 nginx` to see nginx logs.
   - Check `docker compose ps` to confirm service names and network.
   - Make sure firewall allows ports 80/443.

If you want, I can add a sample `other` service into `docker-compose.yml` and a simple static site under `other-site/` so you can test host-based routing locally. Tell me the domain names you plan to use (or placeholders) and I will add the example.
