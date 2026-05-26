# Backend Scripts Guide

This directory contains administrative scripts for managing InfraShop data and configuration.

## Available Scripts

### `apply_schema.js` - Database Setup/Migrations

Applies database schema and migrations. Run this when:
- Setting up a new database
- Applying pending migrations
- Resetting schema

**Usage:**

```bash
# From backend directory
npm run migrate:apply

# Or directly
node scripts/apply_schema.js
```

**What it does:**

1. Connects to database using `DATABASE_URL` from `.env`
2. Reads all `.sql` files from `migrations/` directory
3. Orders them by filename (schema.sql first, then 000-*.sql, 001-*.sql, etc.)
4. Executes each migration file
5. Tracks applied migrations (idempotent - won't re-run)

**Output:**

```
Connecting to database...
Applying schema.sql... ✓
Applying 000-add-group-columns.sql... ✓
Applying 001-add-item-auto-add-columns.sql... ✓
All migrations applied successfully!
```

**Troubleshooting:**

```bash
# If database connection fails:
# Check DATABASE_URL in .env
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"  # Test connection

# If migrations already applied:
# Script idempotently handles this - safe to re-run
npm run migrate:apply

# If specific migration fails:
# Apply manually to debug
psql $DATABASE_URL < migrations/003-mytarget.sql
```

See `../migrations/guide.md` for detailed migration information.

---

### `create_admin.js` - Create User Accounts

Creates new user accounts with specified role (admin, moderator, or customer).

**Usage:**

```bash
# Create admin (requires ADMIN_ROLE=admin)
npm run create_admin
# or
ADMIN_ROLE=admin node scripts/create_admin.js

# Create moderator
npm run create_moderator
# or
ADMIN_ROLE=moderator node scripts/create_admin.js

# Create custom role
ADMIN_ROLE=customer node scripts/create_admin.js
```

**Interactive Prompt:**

```
Enter email: user@example.com
Enter password: [hidden input]
Enter display name (optional): John Doe

User created successfully!
ID: 3
Email: user@example.com
Role: admin
```

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_ROLE` | Role to assign new user | `customer` |
| `DATABASE_URL` | Database connection | From .env |

**Features:**

- ✅ Password hashed securely with bcrypt
- ✅ Password hidden during input (interactive mode)
- ✅ Email validation
- ✅ Duplicate email detection
- ✅ Supports all roles (admin, moderator, customer)

**Non-Interactive Use (CI/CD):**

```bash
# Script supports stdin for non-interactive setup
echo -e "admin@test.com\npassword123\nAdmin User" | node scripts/create_admin.js

# Or set environment for batch operations
ADMIN_ROLE=admin DB_USER=postgres node scripts/create_admin.js
```

**Troubleshooting:**

```bash
# "User already exists" error
# Email is already in database - use different email

# "Database connection failed"
# Check DATABASE_URL in .env or environment

# "Email validation failed"
# Make sure email format is valid: user@domain.com
```

---

### `populate_images.sh` - (If exists)

Populates test images for development. Usage:

```bash
bash scripts/populate_images.sh
```

---

## Common Tasks

### Set Up New Database

```bash
# 1. Create .env file with DATABASE_URL
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://infrashop_user:password@localhost:5432/infrashop_db
JWT_SECRET=your_secret_here
NODE_ENV=development
EOF

# 2. Apply schema and migrations
npm run migrate:apply

# 3. Create admin user
npm run create_admin
```

### Reset Database

```bash
# WARNING: Deletes all data!

# 1. Drop all tables
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Reapply schema
npm run migrate:apply

# 3. Create new admin user
npm run create_admin
```

### Create Multiple Users

```bash
# Script approach
echo -e "user1@test.com\npass1\nUser One" | node scripts/create_admin.js
echo -e "user2@test.com\npass2\nUser Two" | ADMIN_ROLE=moderator node scripts/create_admin.js

# Or SQL directly
psql $DATABASE_URL << 'EOF'
INSERT INTO users (email, password_hash, display_name, role)
VALUES ('test@test.com', '$2b$10$hashhere', 'Test User', 'customer');
EOF
```

### Verify User Created

```bash
# SQL query
psql $DATABASE_URL -c "SELECT id, email, role FROM users;"

# From backend (Node.js)
const db = require('./db');
const result = await db.query('SELECT * FROM users WHERE email=$1', ['user@test.com']);
console.log(result.rows[0]);
```

---

## Development Workflows

### Fresh Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npm run migrate:apply

# 3. Create test admin
npm run create_admin

# 4. Start development server
npm run dev
```

### CI/CD Pipeline

```bash
#!/bin/bash
set -e

# Install
npm install

# Apply migrations
npm run migrate:apply

# Create test admin (non-interactive)
echo -e "ci@test.com\ntestpass123\nCI User" | node scripts/create_admin.js

# Run tests
npm run test:*

# Build
npm run build
```

### Docker Setup

```dockerfile
# In Dockerfile
RUN npm install
RUN npm run migrate:apply
RUN echo -e "app@docker.local\ndockerpass\nApp" | npm run create_admin
CMD npm start
```

---

## Script Implementation Details

### Password Hashing

All scripts use `bcrypt` with 10 salt rounds:

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
```

This ensures passwords are secure and unique (each run produces different hash for same password).

### Database Connection

Scripts use the `pg` (node-postgres) library:

```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const result = await pool.query('INSERT INTO ...');
await pool.end();
```

### Error Handling

All scripts include error handling:

```javascript
try {
  // Operation
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
```

---

## Troubleshooting

### "DATABASE_URL not set"

**Solution**: Create `.env` file in backend directory:

```bash
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/database
EOF
```

Or provide as environment variable:

```bash
DATABASE_URL=postgresql://... npm run migrate:apply
```

### "Connection refused"

**Issue**: PostgreSQL server not running or wrong connection details

**Solution**:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Start if not running
sudo systemctl start postgresql
```

### "Permission denied"

**Issue**: Database user doesn't have permission to create tables

**Solution**: Create user with proper permissions:

```bash
psql -U postgres << 'EOF'
CREATE USER infrashop_user WITH PASSWORD 'password';
CREATE DATABASE infrashop_db OWNER infrashop_user;
GRANT ALL PRIVILEGES ON DATABASE infrashop_db TO infrashop_user;
EOF
```

### "Email already exists"

**Solution**: Use different email or delete existing user:

```bash
# Delete user
psql $DATABASE_URL -c "DELETE FROM users WHERE email='user@test.com';"

# Then recreate
npm run create_admin
```

---

## Advanced Usage

### Only Run Specific Migration

```bash
# Apply just one migration manually
psql $DATABASE_URL < migrations/003-my-migration.sql
```

### Verify Migrations Applied

```bash
# Check tables exist
psql $DATABASE_URL -c "\dt"

# Check specific migration
psql $DATABASE_URL -c "SELECT version FROM migration_log WHERE name='003-my-migration.sql';"
```

### Batch Create Users

For production onboarding:

```javascript
const users = [
  { email: 'admin@company.com', password: 'initial123', role: 'admin' },
  { email: 'mod@company.com', password: 'initial123', role: 'moderator' }
];

for (const user of users) {
  await createUser(user);
}
```

---

## See Also

- `../guide.md` - Backend overview
- `../migrations/guide.md` - Database migration details
- `../auth/guide.md` - Authentication and user management
- `../../Makefile` - Automation commands
