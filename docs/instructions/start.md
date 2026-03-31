# To restart the server after making modifications
'''bash=
systemctl restart infrashop-backend && sleep 2 && curl -s http://localhost:3000/api/health
'''