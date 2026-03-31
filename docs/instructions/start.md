# To restart the server after making modifications
´´´bash=
systemctl restart infrashop-backend && sleep 2 && curl -s http://localhost:3000/api/health
´´´
´´´
cd /srv/infrashop/frontend && npm run build 2>&1 | tail -10
´´´