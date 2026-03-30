# Push rotated secrets to server (manual)

This repository includes a manual GitHub Actions workflow to push rotated runtime secrets (the `.env`) to your production server and restart the backend.

How it works
- The workflow `Push rotated secrets to server (manual)` is in `.github/workflows/push-secrets.yml`.
- It runs only via `workflow_dispatch` (manual trigger).
- It uses the SSH private key stored in repository secrets to upload a temporary `.env` and atomically move it into place on the server, then restarts the backend service.

Required repository secrets (set these in GitHub > Settings > Secrets > Actions):
- `SSH_PRIVATE_KEY` — private SSH key for the deploy user (keep restricted on the server).
- `DEPLOY_USER` — username to SSH as (example: `ubuntu`).
- `DEPLOY_HOST` — host or IP of the target server (example: `server.example.com`).
- `NEW_POSTGRES_PASSWORD` — the rotated DB password you want to deploy.
- `NEW_JWT_SECRET` — the new JWT secret.
- Optional: `REMOTE_ENV_PATH` — path to write the env file on the server (default: `/home/kelmi/infrashop_2_0/.env`).

Security notes
- Use GitHub Environments to require approvals before deploy to production.
- Use a dedicated deploy key (SSH key) that is restricted (authorized_keys options or limited account).
- Avoid including sensitive values in workflow logs. GitHub masks secrets but review job output carefully.

Usage
1. Add the required secrets in GitHub repository settings.
2. In the Actions tab, find the workflow "Push rotated secrets to server (manual)" and run it.
3. Verify `GET /api/health` and perform a login smoke test after the restart.

If you'd like, I can also add a variant that writes to Vault (recommended for a long-term solution) and config examples for fetching secrets at container startup.
