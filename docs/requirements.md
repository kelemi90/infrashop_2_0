# Using requirements.txt

This project includes `requirements.txt` as an informational list of system packages, Node/npm versions, and the project's npm dependencies. It is not a Python pip-style requirements file; instead it documents what you need to install on a server (Ubuntu/Debian) before running the app.

Below are step-by-step instructions and examples for using the file.

## High-level steps
1. Install system packages listed in `requirements.txt` (Ubuntu/Debian example provided below).
2. Install Node.js (v18+) and npm (we recommend using nvm).
3. Install project npm dependencies in `backend` and `frontend`.
4. Start the application with Docker Compose or run locally.

## Install system dependencies (Ubuntu/Debian example)
Run these commands on your server (you can copy/paste):

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release \
  build-essential pkg-config python3 python3-dev libvips-dev libvips-tools
```

Notes:
- `libvips` is required by `sharp` (image processing). Installing `libvips-dev` and `libvips-tools` prevents native build failures when installing `sharp`.
- If you are deploying with Docker, the container images often include necessary system libraries. Installing system packages on the host is mainly required when running `npm install` on the host.

## Install Docker (recommended for production)
Follow the official Docker installation instructions, or use the commands in the project's README under "Docker (docker compose)".

## Install Node.js using nvm (recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18
```

## Install npm dependencies
From project root:

```bash
# Backend
cd backend && npm install
# Frontend
cd ../frontend && npm install
```

If `npm install` fails while installing `sharp`, ensure `libvips` (libvips-dev) is installed on the host (for local installs) or that the Dockerfile for backend includes libvips for container builds.

## Using the Makefile
A `Makefile` is included in the project root with convenient targets. Examples:

```bash
# Install node (manual guidance)
make install-node

# Install backend and frontend deps
make deps

# Build and run docker compose stack
make compose-up

# Run the setup script (creates admin/promotes user, imports data)
ADMIN_EMAIL=you@host ADMIN_PASS=secret make setup

# Dry-run the setup script
make dry-run-setup
```

## Using `scripts/setup_prod.sh`
- Dry-run: preview actions without changes
  ```bash
  bash scripts/setup_prod.sh --dry-run
  ```
- Real run (creates admin, imports data if DB empty and populates image volume):
  ```bash
  ADMIN_EMAIL=you@host ADMIN_PASS=secret bash scripts/setup_prod.sh
  ```
- Skip creating backup of the image volume before populating it:
  ```bash
  ADMIN_EMAIL=you@host ADMIN_PASS=secret bash scripts/setup_prod.sh --no-backup
  ```

Backups created by the script are stored under `scripts/backup/` by default.

## Notes
- `requirements.txt` is intentionally not a pip/pipenv/poetry manifest — it documents system-level dependencies and npm package names/versions. Use the commands above to install packages.
- If you deploy with Docker Compose, most of the system-level needs are satisfied inside the container images. Installing system packages on the host is only necessary for host-based development or when building native modules locally.

If you'd like, I can add an `scripts/install_deps_ubuntu.sh` that automates the apt installs and nvm/node install steps. Would you like that? 