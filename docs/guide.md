# Documentation Guide

This directory contains technical documentation for InfraShop developers and operators.

## Structure

```
docs/
├── requirements.md              # System requirements
├── instructions/
│   ├── README.md               # Instructions overview
│   ├── start.md                # Getting started guide
│   └── (other guides...)
└── guide.md                    # This file
```

## File Organization

### `requirements.md` - System Requirements

Lists hardware, software, and system requirements for:

- **Development** - Local machine setup
- **Staging** - Testing environment
- **Production** - Live deployment

Topics covered:
- OS versions supported
- Node.js version
- PostgreSQL version
- Memory/CPU/Storage requirements
- Dependencies (Docker, Nginx, etc.)

**Usage:** Refer before installation to ensure compatibility

### `instructions/` - User & Operator Guides

Step-by-step operational guides for end users and system operators:

#### `start.md` - Getting Started

Quick start guide for new developers:
- Setting up development environment
- Running locally
- Testing API
- Building/deploying

#### Other Guides

May include:
- How to create users
- Order management workflow
- Troubleshooting
- Common tasks
- FAQ

**Usage:** Reference when learning the system

## Documentation Best Practices

### Writing Guidelines

1. **Structure**
   - Clear headings (# for sections)
   - Numbered lists for steps
   - Bullet points for options
   - Code blocks for examples

2. **Content**
   - Assume reader skill level
   - Start simple, add complexity
   - Provide examples
   - Include troubleshooting

3. **Examples**

   ✅ GOOD:
   ```bash
   # Verify installation
   psql $DATABASE_URL -c "SELECT version();"
   ```

   ✗ BAD:
   ```
   Check that psql works
   ```

4. **Accuracy**
   - Test procedures before documenting
   - Update when features change
   - Include version info if relevant

### Documentation in Code

Complement docs/ with inline documentation:

- **Comments** - Explain complex logic
- **JSDoc** - Function documentation in code
- **README files** - In each folder (like this guide.md)

### Links

Reference between docs:
```markdown
See [Backend Guide](../../backend/guide.md) for API details
See [Installation](../../installation/guide.md) for setup
```

---

## Folder-Specific Documentation

Each major folder has its own `guide.md`:

| Folder | Guide | Purpose |
|--------|-------|---------|
| `ansible/` | [ansible/guide.md](../../ansible/guide.md) | Infrastructure automation |
| `backend/` | [backend/guide.md](../../backend/guide.md) | API & backend |
| `backend/migrations/` | [backend/migrations/guide.md](../../backend/migrations/guide.md) | Database management |
| `backend/routes/` | [backend/routes/guide.md](../../backend/routes/guide.md) | REST API endpoints |
| `backend/auth/` | [backend/auth/guide.md](../../backend/auth/guide.md) | Authentication |
| `backend/scripts/` | [backend/scripts/guide.md](../../backend/scripts/guide.md) | Admin scripts |
| `frontend/` | [frontend/guide.md](../../frontend/guide.md) | React frontend |
| `installation/` | [installation/guide.md](../../installation/guide.md) | Installation process |
| `nginx/` | [nginx/guide.md](../../nginx/guide.md) | Web server config |
| `scripts/` | [scripts/guide.md](../../scripts/guide.md) | Utility scripts |
| `systemd/` | [systemd/guide.md](../../systemd/guide.md) | Service management |

---

## Main Documentation Files

### `README.md`

Project overview at repo root:
- What is InfraShop?
- Quick start
- Architecture overview
- Links to detailed docs

### `INSTALL_SERVER.md`

Server installation guide:
- Prerequisites
- Step-by-step installation
- Configuration
- Verification
- Troubleshooting

### `RELEASE.md`

Release notes and changelog:
- Version history
- Breaking changes
- New features
- Deprecations
- Migration guides

### `Makefile`

Build automation:
- Common commands
- Development setup
- Docker operations
- Documentation

---

## Using These Docs

### For New Developers

1. Start with [main README.md](../../README.md)
2. Read [Getting Started](instructions/start.md)
3. Follow [Backend Guide](../../backend/guide.md)
4. Check [Frontend Guide](../../frontend/guide.md)
5. Review [API Documentation](../../backend/routes/guide.md)

### For System Operators

1. Check [System Requirements](requirements.md)
2. Follow [Installation Guide](../../installation/guide.md)
3. Review [Service Management](../../systemd/guide.md)
4. Study [Nginx Configuration](../../nginx/guide.md)
5. Keep [Backup Procedures](../../backend/migrations/guide.md#backing-up) handy

### For Troubleshooting

1. Check service logs: `sudo journalctl -u infrashop-backend`
2. See [Backend Guide - Troubleshooting](../../backend/guide.md#troubleshooting)
3. Check [Nginx Guide - Troubleshooting](../../nginx/guide.md#troubleshooting)
4. Review [Installation Guide - Troubleshooting](../../installation/guide.md#troubleshooting)
5. Check [Systemd Guide - Troubleshooting](../../systemd/guide.md#troubleshooting)

---

## Contributing Documentation

### Add New Documentation

Create a new `.md` file:

```bash
# In appropriate folder
docs/new_topic.md
```

Include:
- Clear title
- Overview
- Step-by-step instructions
- Examples
- Troubleshooting
- Links to related docs

### Update Existing Documentation

If you find outdated or incomplete:

1. **Test the procedure** to verify accuracy
2. **Update** the documentation
3. **Add examples** if missing
4. **Link** to related docs
5. **Check links** still work

### Documentation Template

```markdown
# Topic Name

Brief description of what this covers.

## Overview

2-3 sentences explaining the feature/process.

## Prerequisites

What needs to be set up first.

## Step-by-Step

1. First step
   ```bash
   command to run
   ```

2. Second step

3. Verification

## Examples

Real-world examples with output.

## Troubleshooting

Common issues and solutions.

## See Also

- [Related Topic](path/to/guide.md)
- [Another Topic](path/other.md)
```

---

## Technical Writing Tips

### Use Clear Language

✅ "Restart the backend service"
✗ "Bounce the backend"

✅ "Your database will be deleted"
✗ "DB might go away"

### Include Context

✅ "Before deploying, ensure PostgreSQL is running: `systemctl start postgresql`"
✗ "Make sure PostgreSQL is running"

### Provide Examples

✅ 
```bash
npm run migrate:apply
# Output: All migrations applied successfully!
```

✗ 
"Run the migrate script"

### Highlight Important Info

Use callouts:
```markdown
⚠️ **WARNING**: This deletes all data!
```

### Keep It Current

Review docs quarterly and update:
- Version numbers
- Deprecated features
- New procedures
- Links

---

## API Documentation

Detailed API docs in [backend/routes/guide.md](../../backend/routes/guide.md):

- All endpoints listed
- Request/response examples
- Error codes
- Authentication
- Rate limits

Reference for:
- Frontend developers building on API
- External integrations
- Testing
- Debugging

---

## Video Documentation

Consider recording:
- Installation walkthrough
- First-time user walkthrough
- Admin dashboard tutorial
- API usage examples

Link in README.md:
```markdown
## Video Tutorials

- [Installation](https://youtube.com/watch?v=...)
- [User Guide](https://youtube.com/watch?v=...)
```

---

## FAQ

Frequently asked questions should be in relevant guides:

**In Backend Guide:**
- How do I add a new API endpoint?
- How do I change database schema?

**In Installation Guide:**
- How do I update an existing installation?
- What if installation fails?

**In Frontend Guide:**
- How do I add a new page?
- How do I customize styling?

Link directly to FAQ entries from related documentation.

---

## Translating Documentation

If supporting multiple languages:

```
docs/
├── requirements.md
├── requirements.fi.md      # Finnish translation
├── requirements.sv.md      # Swedish translation
└── ...
```

---

## See Also

- [Main README.md](../../README.md) - Project overview
- [INSTALL_SERVER.md](../../INSTALL_SERVER.md) - Installation
- [Folder-Specific Guides](#folder-specific-documentation)
- Each folder's `guide.md` file
