# To create a moderator account from the backend, use:
```bash
sudo -u infrashop bash -lc "set -a; [ -f /srv/infrashop/.env ] && . /srv/infrashop/.env; [ -f /srv/infrashop/backend/.env ] && . /srv/infrashop/backend/.env; set +a; cd /srv/infrashop/backend && DB_HOST=127.0.0.1 ADMIN_EMAIL=moderator@example.com ADMIN_PASSWORD='<MODERATOR_PASSWORD>' ADMIN_DISPLAY_NAME='Moderator' npm run create_moderator"
```

# To create or update an admin account with the same path, use:

```bash
sudo -u infrashop bash -lc "set -a; [ -f /srv/infrashop/.env ] && . /srv/infrashop/.env; [ -f /srv/infrashop/backend/.env ] && . /srv/infrashop/backend/.env; set +a; cd /srv/infrashop/backend && DB_HOST=127.0.0.1 ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<ADMIN_PASSWORD>' ADMIN_DISPLAY_NAME='Admin' npm run create_admin"
```

# Run POST test

```bash
cd /srv/infrashop/backend
TEST_EMAIL="your-admin-or-moderator@email" \
TEST_PASSWORD="current-password" \
TEST_NEW_PASSWORD="temporary-new-password-123" \
npm run test:change_password
```