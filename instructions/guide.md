# Instructions Guide

This directory contains user-facing instructions and operational guides for InfraShop.

## Files

- `README.md` - Overview of instructions
- `start.md` - Getting started guide
- `add_user.md` - How to add new users
- `update.md` - How to update the system
- `guide.md` - This file

## Purpose

Unlike technical documentation in `docs/`, this folder contains **practical, task-focused instructions** for:

- **End Users** - How to use the system
- **Administrators** - How to manage the system
- **Operators** - How to maintain the system

## Content Overview

### `README.md` - Instructions Overview

Main index of all instructions:

- What each instruction covers
- Who should read it
- Prerequisites for each guide
- Quick links to common tasks

**Use this** when you need to find the right instruction.

### `start.md` - Getting Started

First guide for new users:

Topics:
- System overview
- User roles (customer, moderator, admin)
- First login
- Dashboard walkthrough
- Creating your first order
- Viewing orders
- Basic troubleshooting

**Read this first** if you're new to InfraShop.

### `add_user.md` - Adding Users

For system administrators managing accounts:

Topics:
- When to add users
- Creating admin users
- Creating moderator users
- Creating customer accounts
- User roles and permissions
- Resetting user passwords
- Deactivating users

**Use this** when onboarding new team members.

### `update.md` - System Updates

For system operators maintaining the installation:

Topics:
- When to update
- Pre-update checklist
- Backup procedure
- Update steps
- Verification
- Rollback if needed
- Troubleshooting failed updates

**Follow this** when upgrading to new versions.

---

## Common Tasks

### I'm a New User - Where do I start?

1. Read [start.md](start.md)
2. Login to the system
3. Create your first order
4. Contact admin if you need help

### I'm an Admin - How do I add users?

1. See [add_user.md](add_user.md)
2. Follow the step-by-step instructions
3. Share login credentials securely with new user
4. Verify they can login

### I'm an Operator - How do I update?

1. See [update.md](update.md)
2. Plan update during low-usage time
3. Backup the system first
4. Follow update steps
5. Verify all working after update

### How do I reset a user's password?

See [add_user.md](add_user.md#resetting-passwords)

### What do I do if something breaks?

1. Check [Troubleshooting section](start.md#troubleshooting) in relevant guide
2. Check system logs: `sudo journalctl -u infrashop-backend`
3. Try restarting service: `sudo systemctl restart infrashop-backend`
4. Refer to [backend troubleshooting](../../backend/guide.md#troubleshooting)

---

## How to Use Instructions

### Reading an Instruction

1. **Check prerequisites** - Do you have everything needed?
2. **Read through completely first** - Don't start mid-way
3. **Follow step-by-step** - Numbers matter
4. **Test each step** - Verify before moving to next
5. **Note any issues** - Document problems for troubleshooting

### Following Procedures Safely

- ✅ Backup before making changes
- ✅ Follow exact steps provided
- ✅ Check output at each step
- ✅ Stop and get help if something unexpected happens
- ✗ Skip steps to save time
- ✗ Guess at passwords or settings
- ✗ Proceed after errors

---

## Different User Roles

### Customer

End users who create and manage orders:

**Helpful Instructions:**
- [start.md](start.md) - How to create orders
- Search for order-related tasks in start.md

**What they can do:**
- Create orders
- View own orders
- Search for products
- See availability

**What they cannot do:**
- Manage inventory
- Create admin accounts
- View all orders
- See reports

### Moderator

Team members with elevated permissions:

**Helpful Instructions:**
- [start.md](start.md) - Full system overview
- [add_user.md](add_user.md) - Create customer accounts
- Manage orders globally

**What they can do:**
- View all orders
- Create customer accounts
- Manage events
- Generate reports
- View inventory

**What they cannot do:**
- Create admin accounts
- Delete users
- Access system configuration
- Change critical settings

### Admin

Full system access and configuration:

**Helpful Instructions:**
- [add_user.md](add_user.md) - Full user management
- [update.md](update.md) - System maintenance
- Backend/database access

**What they can do:**
- Everything
- Create/delete users
- Configure system
- Access logs
- Manage database

---

## Step-by-Step Template

Instructions follow this format:

```markdown
# Task Name

Brief description.

## Prerequisites

What needs to be done first.

## Steps

1. First action
   - Sub-action if applicable
   - Expected result

2. Second action
   - Verify this worked

3. Continue...

## Verification

How to confirm it worked.

## Troubleshooting

Common issues while doing this task.

## See Also

Related instructions or documentation.
```

---

## Quick Reference

### System Status

```bash
# Check if services running
sudo systemctl status infrashop-backend
sudo systemctl status infrashop-frontend

# View recent logs
sudo journalctl -u infrashop-backend -n 50

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
```

### Common Commands

```bash
# Restart backend
sudo systemctl restart infrashop-backend

# Backup database
sudo -u postgres pg_dump infrashop_db > backup.sql

# Create admin user
cd /srv/infrashop && npm run create_admin

# Apply migrations
cd /srv/infrashop/backend && npm run migrate:apply

# View error logs
sudo journalctl -u infrashop-backend PRIORITY=err
```

### Emergency Procedures

**If system won't start:**

1. Check service status: `sudo systemctl status infrashop-backend`
2. View logs: `sudo journalctl -u infrashop-backend -n 100`
3. Try restart: `sudo systemctl restart infrashop-backend`
4. Check database: `sudo systemctl status postgresql`
5. Restart PostgreSQL: `sudo systemctl restart postgresql`

**If locked out:**

1. Contact system admin
2. Admin can reset password: See [add_user.md](add_user.md#resetting-passwords)
3. Or access via terminal: See [Backend Documentation](../../backend/scripts/guide.md)

**If data seems wrong:**

1. Don't panic - backups exist
2. Contact admin immediately
3. Don't make changes to database manually
4. Refer to [Backup Procedures](../../backend/migrations/guide.md#backing-up)

---

## Getting Help

If instructions don't work:

1. **Read through completely again** - You might have missed something
2. **Check prerequisites** - Do you have everything needed?
3. **Review the step-by-step** - Did you skip a step?
4. **Check error messages** - What exactly is failing?
5. **See troubleshooting section** - Does it cover your issue?
6. **Contact system admin** - They can help debug

When asking for help, provide:
- What you were trying to do
- Which instruction you followed
- What step failed
- What error message you saw
- What you've already tried

---

## Contributing Instructions

### Report Issues

If an instruction:
- Doesn't work
- Is unclear
- Has outdated information
- Needs more examples

Create an issue or contact maintainers.

### Suggest New Instructions

Common tasks that need instructions:
- "How do I...?"
- "I need to..."
- "What's the procedure to...?"

Suggest new instructions for:
- Frequently asked questions
- New features
- Common admin tasks
- Troubleshooting scenarios

### Update Instructions

If you find better/clearer steps:

1. Test the new procedure
2. Document it clearly
3. Include examples
4. Get review from experienced user
5. Update the instruction

---

## Instruction Index

Quick reference to all instructions:

| Instruction | For | Time | Difficulty |
|-------------|-----|------|------------|
| [start.md](start.md) | Everyone | 15 min | Easy |
| [add_user.md](add_user.md) | Admin | 10 min | Easy |
| [update.md](update.md) | Operator | 30 min | Medium |

---

## See Also

- [README.md](README.md) - Main instructions overview
- [docs/guide.md](../../docs/guide.md) - Technical documentation
- [backend/guide.md](../../backend/guide.md) - Backend technical docs
- [installation/guide.md](../../installation/guide.md) - Installation guide
