# Backend Guide

The backend is a Node.js/Express application that provides REST API endpoints for InfraShop. It handles authentication, order management, item inventory, and PDF generation.

## Structure

```
backend/
├── server.js                    # Main Express server
├── db.js                        # Database connection pool
├── package.json                 # Dependencies and scripts
├── Dockerfile                   # Container image definition
├── auth/
│   └── roles.js                 # Role-based access control middleware
├── migrations/
│   ├── schema.sql               # Main database schema
│   ├── 000-*.sql                # Migration files (numbered sequentially)
│   ├── guide.md                 # How to create and apply migrations
│   └── (other migrations...)
├── routes/
│   ├── items.js                 # /api/items endpoints
│   ├── orders.js                # /api/orders endpoints (see guide.md)
│   ├── events.js                # /api/events endpoints
│   ├── itemGroups.js            # /api/item-groups endpoints
│   ├── auth.js                  # /api/auth endpoints
│   ├── reports.js               # /api/reports endpoints
│   └── guide.md                 # API documentation
├── scripts/
│   ├── apply_schema.js          # Apply database schema / migrations
│   ├── create_admin.js          # Create admin/user accounts
│   └── guide.md                 # How to use admin scripts
├── public/
│   └── images/                  # Uploaded item images
├── tests/
│   └── (test files...)
└── varasto.csv                  # Example inventory CSV import
```

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create .env File

Create `backend/.env` with required variables:

```env
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/infrashop_db

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_secret_key_here_change_in_production

# API Settings
API_PORT=3000
NODE_ENV=development

# File uploads
UPLOAD_DIR=./public/images
MAX_FILE_SIZE=10485760

# Email (optional, for future features)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

### 3. Initialize Database

```bash
npm run migrate:apply
```

This creates all tables defined in `backend/migrations/schema.sql`.

### 4. Create Admin User

```bash
npm run create_admin
```

You'll be prompted for email and password.

### 5. Start Development Server

```bash
npm run dev
```

The server runs on `http://localhost:3000` by default.

Production build:
```bash
npm start
```

## Development Scripts

Available npm scripts in `package.json`:

```bash
npm run start                     # Start production server
npm run dev                       # Start with auto-reload (nodemon)
npm run migrate:apply             # Apply database migrations
npm run create_admin              # Create admin account
npm run create_moderator          # Create moderator account
npm run test:change_password      # Test password change endpoint
```

## API Routes

Main API endpoints:

- **Authentication**: `/api/auth/*` - Login, register, password change
- **Items**: `/api/items` - Product catalog
- **Orders**: `/api/orders` - Create, read, update orders
- **Events**: `/api/events` - Event management
- **Item Groups**: `/api/item-groups` - Product groups
- **Reports**: `/api/reports` - Business reports

See `routes/guide.md` for detailed API documentation.

## Authentication

The backend uses JWT (JSON Web Tokens) for authentication:

1. User sends credentials to `/api/auth/login`
2. Backend returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Backend verifies token and processes request

See `auth/roles.js` for role-based access control (RBAC) implementation.

## Database

### Schema Management

Migrations are managed in `backend/migrations/`:

- **schema.sql** - Initial table definitions
- **00X-*.sql** - Numbered migration files applied in sequence

To run migrations:
```bash
npm run migrate:apply
```

See `migrations/guide.md` for detailed migration instructions.

### Database Connection

Handled by `db.js` using the `pg` (node-postgres) library:
- Connection pooling enabled
- Uses `DATABASE_URL` environment variable
- Handles reconnection

### Common Queries

Access the database directly (development only):

```bash
# Connect to PostgreSQL
psql DATABASE_URL

# \d                                  # List all tables
# \d table_name                       # Show table schema
# SELECT * FROM orders LIMIT 5;       # Query orders
```

## File Uploads

Images are stored in `backend/public/images/`:

- Upload endpoint: `POST /api/items/{id}/upload-image`
- Images are resized/optimized using Sharp library
- Returns `image_url` and `thumbnail_url`
- Original files stored in `public/images/`

## Testing

Run tests from `backend/tests/`:

```bash
npm run test:change_password
# Runs integration test for password change flow
```

## Deployment

### Docker

Build container:
```bash
docker build -t infrashop-backend .
```

Run container:
```bash
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3000:3000 infrashop-backend
```

### systemd Service

See `../systemd/guide.md` for running as a system service.

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env
API_PORT=3001

# Or kill process using port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Error

Check `DATABASE_URL` in `.env`:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### JWT Token Issues

- Verify `JWT_SECRET` is set and consistent
- Check token expiration: tokens expire after defined period
- Ensure Authorization header format is correct: `Bearer <token>`

### Image Upload Issues

- Check `public/images/` directory exists and is writable
- Verify `UPLOAD_DIR` path in `.env`
- Check `MAX_FILE_SIZE` limit

## Monitoring Logs

Production logs via systemd:

```bash
# View backend logs
sudo journalctl -u infrashop-backend -f

# Last 50 lines
sudo journalctl -u infrashop-backend -n 50
```

Development logs appear in console.

## Performance

### Database Indexes

Key indexes are created on:
- `orders(id, user_id, status)`
- `items(id, sku, category)`
- `order_items(order_id, item_id)`

Check indexes:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'orders';
```

### Caching

Currently no caching layer. Consider adding Redis for:
- User sessions
- Item catalog caching
- Rate limiting

## Security

- **JWT Secret**: Use strong random string in production
- **Password hashing**: Uses bcrypt (salted hash)
- **CORS**: Configure for your frontend domain
- **Rate limiting**: Not yet implemented (recommended for production)
- **SQL Injection**: Prevented via parameterized queries

## See Also

- `routes/guide.md` - REST API endpoint documentation
- `migrations/guide.md` - Database migration guide
- `auth/roles.js` - Authentication and RBAC implementation
- `scripts/guide.md` - Administrative scripts guide
- `../docker-compose.yml` - Full stack with database
