# To create a moderator account from the backend, use:
```sudo -u infrashop bash -lc "cd /srv/infrashop/backend && ADMIN_EMAIL=moderator@example.com ADMIN_PASSWORD='<MODERATOR_PASSWORD>' ADMIN_DISPLAY_NAME='Moderator' npm run create_moderator"```

# To create or update an admin account with the same path, use:

```sudo -u infrashop bash -lc "cd /srv/infrashop/backend && ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<ADMIN_PASSWORD>' ADMIN_DISPLAY_NAME='Admin' npm run create_admin"```