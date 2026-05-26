# InfraShop Documentation Index

Complete guide to all documentation and resources in the InfraShop project.

## 🚀 Quick Start

| Role | Start Here |
|------|-----------|
| **New User** | [instructions/start.md](instructions/start.md) |
| **Developer** | [backend/guide.md](backend/guide.md) & [frontend/guide.md](frontend/guide.md) |
| **System Admin** | [installation/guide.md](installation/guide.md) & [systemd/guide.md](systemd/guide.md) |
| **Nobody home?** | [README.md](README.md) - Project overview |

---

## 📚 Complete Folder Guide Index

### Core Application

#### **Backend** - REST API & Business Logic
- **Master Guide:** [backend/guide.md](backend/guide.md)
- **Subfolders:**
  - **Routes** [backend/routes/guide.md](backend/routes/guide.md) - REST API endpoints
  - **Migrations** [backend/migrations/guide.md](backend/migrations/guide.md) - Database management
  - **Auth** [backend/auth/guide.md](backend/auth/guide.md) - Authentication & authorization
  - **Scripts** [backend/scripts/guide.md](backend/scripts/guide.md) - Admin utilities

**Learn about:** Node.js API, authentication, database, migrations, JWT tokens

#### **Frontend** - React UI
- **Master Guide:** [frontend/guide.md](frontend/guide.md)

**Learn about:** React/Vite app, components, styling, API integration, state management

### Infrastructure & Deployment

#### **Installation** - Server Setup
- **Master Guide:** [installation/guide.md](installation/guide.md)

**Learn about:** Ubuntu installation script, automated setup, prerequisites, troubleshooting

#### **Ansible** - Infrastructure as Code
- **Master Guide:** [ansible/guide.md](ansible/guide.md)

**Learn about:** Infrastructure automation, playbooks, multi-server deployment

#### **Nginx** - Web Server
- **Master Guide:** [nginx/guide.md](nginx/guide.md)

**Learn about:** SSL/TLS, reverse proxy, static serving, performance tuning

#### **Systemd** - Service Management
- **Master Guide:** [systemd/guide.md](systemd/guide.md)

**Learn about:** Services as system daemons, auto-start, logging, monitoring

### Utilities & Operations

#### **Scripts** - Deployment & Maintenance
- **Master Guide:** [scripts/guide.md](scripts/guide.md)

**Learn about:** Production setup, admin creation, image verification, secret rotation

### Documentation & Instructions

#### **Documentation** - Technical Guides
- **Master Guide:** [docs/guide.md](docs/guide.md)

**Learn about:** System requirements, technical documentation organization

#### **Instructions** - User Guides
- **Master Guide:** [instructions/guide.md](instructions/guide.md)
- **Key Files:**
  - [instructions/start.md](instructions/start.md) - Getting started
  - [instructions/add_user.md](instructions/add_user.md) - User management
  - [instructions/update.md](instructions/update.md) - System updates

**Learn about:** Task-focused guides for users, admins, operators

---

## 📖 By Role / Use Case

### I'm a New User

1. **Start:** [instructions/start.md](instructions/start.md)
2. **Learn:** Main product workflow
3. **Share:** [instructions/add_user.md](instructions/add_user.md) with admins
4. **Help:** Ask questions in [instructions/](instructions/)

### I'm a Developer

**Frontend Development:**
1. Start: [frontend/guide.md](frontend/guide.md)
2. Learn: React components, styling, API integration
3. Reference: [backend/routes/guide.md](backend/routes/guide.md) for API endpoints

**Backend Development:**
1. Start: [backend/guide.md](backend/guide.md)
2. Learn: Node.js, Express, database, authentication
3. Reference: [backend/migrations/guide.md](backend/migrations/guide.md) for database changes

**Full Stack:**
1. Read: [backend/guide.md](backend/guide.md) + [frontend/guide.md](frontend/guide.md)
2. Follow: [docker-compose.yml](docker-compose.yml) for local setup
3. Reference: All subfolders as needed

### I'm a DevOps / System Administrator

**Initial Setup:**
1. Start: [installation/guide.md](installation/guide.md)
2. Follow: Automated installation script
3. Configure: Review [systemd/guide.md](systemd/guide.md)

**Ongoing Operations:**
1. Monitor: [systemd/guide.md](systemd/guide.md#monitoring--health-checks)
2. Backup: [backend/migrations/guide.md](backend/migrations/guide.md#backing-up)
3. Update: [instructions/update.md](instructions/update.md)
4. Troubleshoot: See troubleshooting in each guide

**Multi-Server Deployment:**
1. Read: [ansible/guide.md](ansible/guide.md)
2. Configure: Inventory files
3. Deploy: Run playbook

### I'm a Network / Operations Engineer

**Web Server:**
1. Start: [nginx/guide.md](nginx/guide.md)
2. Learn: Reverse proxy, SSL, performance

**Services:**
1. Read: [systemd/guide.md](systemd/guide.md)
2. Monitor: Health checks, logs, automation

**Scripts:**
1. Review: [scripts/guide.md](scripts/guide.md)
2. Use: For automated deployment & maintenance

---

## 🛠️ Common Tasks

### How do I...

**Start the application locally?**
- Follow: [docker-compose.yml](docker-compose.yml) or [backend/guide.md](backend/guide.md#getting-started)

**Deploy to production?**
- Follow: [installation/guide.md](installation/guide.md)

**Add a new API endpoint?**
- Learn: [backend/routes/guide.md](backend/routes/guide.md)
- Reference: `backend/routes/items.js` example implementations

**Add a new React page?**
- Learn: [frontend/guide.md](frontend/guide.md)
- Reference: Example pages in `frontend/src/pages/`

**Create a database migration?**
- Learn: [backend/migrations/guide.md](backend/migrations/guide.md#creating-a-new-migration)
- Run: `npm run migrate:apply`

**Create an admin user?**
- Learn: [instructions/add_user.md](instructions/add_user.md)
- Run: `npm run create_admin`

**Debug a failing request?**
- Check: [backend/routes/guide.md](backend/routes/guide.md#error-responses)
- Debug: Browser DevTools network tab

**Update the system?**
- Follow: [instructions/update.md](instructions/update.md)

**Rotate security credentials?**
- Run: `bash scripts/rotate_secrets_ipv4.sh`
- Learn: [scripts/guide.md](scripts/guide.md#rotate_secrets_ipv4-sh---security-key-rotation)

**Check service status?**
- Run: `sudo systemctl status infrashop-backend`
- Learn: [systemd/guide.md](systemd/guide.md)

**View application logs?**
- View: `sudo journalctl -u infrashop-backend -f`
- Learn: [systemd/guide.md](systemd/guide.md#view-service-logs)

**Backup the database?**
- Run: `sudo -u postgres pg_dump infrashop_db > backup.sql`
- Learn: [backend/migrations/guide.md](backend/migrations/guide.md#backing-up)

**Configure auto-scaling/monitoring?**
- Script using: [systemd/guide.md](systemd/guide.md#systemd-timers-scheduled-tasks)
- Monitor via: `systemctl list-timers`

---

## 🚨 On the Fly Help

### Something's Broken

1. **Check status:** `sudo systemctl status infrashop-*`
2. **View logs:** `sudo journalctl -u infrashop-backend -n 100`
3. **Find solution:** See troubleshooting in relevant guide:
   - [backend/guide.md#troubleshooting](backend/guide.md#troubleshooting)
   - [installation/guide.md#troubleshooting](installation/guide.md#troubleshooting)
   - [nginx/guide.md#troubleshooting](nginx/guide.md#troubleshooting)
   - [systemd/guide.md#troubleshooting](systemd/guide.md#troubleshooting)

### I Don't Know Where to Start

1. What's your role? See [By Role](#by-role--use-case) section
2. What are you trying to do? See [Common Tasks](#-common-tasks)
3. Still stuck? Check [README.md](README.md) for overview

### Need More Detail?

Each folder has its own `guide.md` with complete information:

- Folder: [Folder/guide.md](Folder/guide.md)

Search within that guide for your specific need.

---

## 📋 Document Map

```
infrashop/
├── README.md                          ← Project overview
├── INSTALL_SERVER.md                  ← Server installation
├── RELEASE.md                         ← Version history
│
├── guide.md                          ← YOU ARE HERE
├── Makefile                          ← Build automation
├── docker-compose.yml                ← Local development
│
├── ansible/
│   ├── playbook.yml
│   ├── roles/infrashop/
│   └── guide.md                      ← Ansible automation
│
├── backend/
│   ├── guide.md                      ← Backend overview
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   │
│   ├── routes/
│   │   ├── guide.md                  ← REST API docs
│   │   ├── auth.js
│   │   ├── items.js
│   │   ├── orders.js
│   │   └── ...
│   ├── auth/
│   │   ├── guide.md                  ← Auth & RBAC
│   │   └── roles.js
│   ├── migrations/
│   │   ├── guide.md                  ← Database management
│   │   ├── schema.sql
│   │   └── 00X-*.sql
│   ├── scripts/
│   │   ├── guide.md                  ← Admin utilities
│   │   ├── apply_schema.js
│   │   └── create_admin.js
│   └── tests/
│
├── frontend/
│   ├── guide.md                      ← Frontend docs
│   ├── package.json
│   ├── vite.config.mjs
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── Dockerfile
│
├── installation/
│   ├── guide.md                      ← Installation automation
│   ├── install-ubuntu.sh
│   └── README.md
│
├── nginx/
│   ├── guide.md                      ← Web server config
│   ├── infrashop.conf
│   └── html/
│
├── systemd/
│   ├── guide.md                      ← Service management
│   └── infrashop.service.example
│
├── scripts/
│   ├── guide.md                      ← Deployment scripts
│   ├── setup_prod.sh
│   ├── run_create_admin.sh
│   └── ...
│
├── docs/
│   ├── guide.md                      ← Documentation org
│   ├── requirements.md
│   └── instructions/
│       ├── README.md
│       ├── start.md
│       └── ...
│
└── instructions/
    ├── guide.md                      ← User guides
    ├── start.md
    ├── add_user.md
    └── update.md
```

---

## 🔗 Quick Links

**Project:**
- [Main README](README.md) - Overview
- [GitHub](https://github.com/kelemi90/infrashop_2_0) - Repository
- [INSTALL_SERVER.md](INSTALL_SERVER.md) - Setup
- [RELEASE.md](RELEASE.md) - Version history

**APIs & Protocols:**
- [REST API](backend/routes/guide.md) - All endpoints
- [Authentication](backend/auth/guide.md) - JWT tokens
- [Database](backend/migrations/guide.md) - Schema & migrations

**Development:**
- [Backend](backend/guide.md) - Node.js/Express
- [Frontend](frontend/guide.md) - React/Vite
- [Local Setup](docker-compose.yml) - Docker Compose

**Operations:**
- [Installation](installation/guide.md) - Server setup
- [Nginx](nginx/guide.md) - Web server
- [Systemd](systemd/guide.md) - Services
- [Ansible](ansible/guide.md) - Multi-server

**User Guides:**
- [Getting Started](instructions/start.md)
- [User Management](instructions/add_user.md)
- [System Updates](instructions/update.md)

---

## 🎓 Learning Path

### For Beginners

1. **Week 1:** Read [README.md](README.md) → [instructions/start.md](instructions/start.md)
2. **Week 2:** Follow [docker-compose.yml](docker-compose.yml) for local setup
3. **Week 3:** Read relevant guide: [backend/](backend/guide.md) or [frontend/](frontend/guide.md)
4. **Week 4:** Build something small using the guide

### For Experienced Engineers

1. **Skim:** [README.md](README.md) - 5 min overview
2. **Review:** Relevant folder guide - 10-15 min
3. **Dive in:** Specific subtopic guide as needed

### For Operations

1. **Read:** [installation/guide.md](installation/guide.md) - Full setup
2. **Configure:** [ansible/guide.md](ansible/guide.md) for your environment
3. **Monitor:** [systemd/guide.md](systemd/guide.md) - Health & logging
4. **Backup:** [backend/migrations/guide.md](backend/migrations/guide.md#backing-up)
5. **Update:** [instructions/update.md](instructions/update.md) - Upgrades

---

## 🆘 Troubleshooting

| Issue | See |
|-------|-----|
| Backend won't start | [backend/guide.md#troubleshooting](backend/guide.md#troubleshooting) |
| API not responding | [backend/routes/guide.md#error-responses](backend/routes/guide.md#error-responses) |
| Database issues | [backend/migrations/guide.md#troubleshooting](backend/migrations/guide.md#troubleshooting) |
| Installation failed | [installation/guide.md#troubleshooting](installation/guide.md#troubleshooting) |
| Nginx errors | [nginx/guide.md#troubleshooting](nginx/guide.md#troubleshooting) |
| Service not running | [systemd/guide.md#troubleshooting](systemd/guide.md#troubleshooting) |
| Frontend not loading | [frontend/guide.md#troubleshooting](frontend/guide.md#troubleshooting) |
| Can't login | [backend/auth/guide.md](backend/auth/guide.md) |

---

## 📝 Contributing to Documentation

Found something unclear? Want to improve docs?

1. **Fix it:** Update the relevant `.md` file
2. **Test it:** Follow your instructions to verify they work
3. **Share:** Create a PR with your improvements

Documentation files to update:
- Folder-specific: `Folder/guide.md`
- User guides: `instructions/*.md`
- Requirements: `docs/requirements.md`

---

## ✅ Quality Checklist

Every guide includes:

- ✓ Clear purpose and overview
- ✓ Prerequisites clearly listed
- ✓ Step-by-step instructions with examples
- ✓ Examples and code blocks
- ✓ Verification procedures
- ✓ Troubleshooting section
- ✓ Links to related documentation

---

## 📞 Getting Help

Can't find what you need?

1. **Search** within relevant guide using browser find (Ctrl+F / Cmd+F)
2. **Check** [By Role](#by-role--use-case) or [Common Tasks](#-common-tasks)
3. **Read** [README.md](README.md) for project overview
4. **Ask** teammates or community

---

## 📅 Documentation Status

Last updated: April 15, 2026

Guides cover:
- ✅ Current features and workflows
- ✅ Installation and deployment
- ✅ Development setup
- ✅ API documentation
- ✅ Troubleshooting

---

**That's it!** You now have complete access to all documentation. Pick a folder above and dive in! 🚀
