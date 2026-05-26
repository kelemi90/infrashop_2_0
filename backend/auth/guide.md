# Authentication & Authorization Guide

This directory implements authentication and role-based access control (RBAC) for InfraShop.

## File Overview

- `roles.js` - Express middleware for authentication and authorization

## Authentication Flow

### 1. Login

User sends credentials to `/api/auth/login`:

```
POST /api/auth/login
{ "email": "user@test.com", "password": "password123" }
```

Backend:
1. Finds user in database
2. Compares password hash using bcrypt
3. Generates JWT token with user info
4. Returns token to client

### 2. Token Storage

Client stores JWT token (usually in localStorage or sessionStorage):

```javascript
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIs...');
```

### 3. Authenticated Requests

Client includes token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 4. Token Verification

Backend middleware (`roles.js`) verifies token:
1. Extracts token from Authorization header
2. Verifies signature using JWT_SECRET
3. Decodes user information
4. Attaches user to request object
5. Allows/denies request based on user role

## Roles (RBAC)

Three user roles with different permissions:

### `admin`
- Full access to all endpoints
- Can manage users, items, events
- Can view all orders
- Can generate reports

### `moderator`
- Can view and manage orders
- Can create items (limited)
- Cannot manage users

### `customer`
- Can create orders
- Can view own orders
- Cannot access admin endpoints
- Cannot modify inventory

## Using Authentication Middleware

In route handlers (`routes/*.js`):

```javascript
const express = require('express');
const router = express.Router();
const { auth, requireAdmin, requireRole } = require('../auth/roles');

// Public route - no auth required
router.get('/public-items', (req, res) => {
  res.json({ items: [] });
});

// Protected route - any authenticated user
router.get('/my-orders', auth, (req, res) => {
  // req.user contains: { id, email, role, ... }
  const userId = req.user.id;
  res.json({ orders: [] });
});

// Admin only
router.post('/admin/items', auth, requireAdmin, (req, res) => {
  // Only admin users can access this
  res.json({ created: true });
});

// Specific role
router.get('/moderate/reports', auth, requireRole('moderator', 'admin'), (req, res) => {
  // Only moderators and admins
  res.json({ reports: [] });
});
```

## Middleware Functions

### `auth` - Verify JWT Token

Verifies token and attaches user to request. Rejects if:
- No Authorization header
- Invalid token signature
- Expired token

```javascript
const { auth } = require('../auth/roles');

router.get('/protected', auth, (req, res) => {
  console.log(req.user);  // { id: 1, email: 'user@test.com', role: 'customer' }
  res.json({ user: req.user });
});
```

### `requireAdmin` - Admin Only

Requires user to have `admin` role:

```javascript
const { auth, requireAdmin } = require('../auth/roles');

router.post('/admin/delete-order/:id', auth, requireAdmin, (req, res) => {
  // Only admins
});
```

### `requireRole` - Role-Based Access

```javascript
const { auth, requireRole } = require('../auth/roles');

// Allow multiple roles
router.get('/reports', auth, requireRole('admin', 'moderator'), (req, res) => {
  // Admin or moderator
});
```

## JWT Token Structure

Tokens are JSON Web Tokens containing:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "id": 1,
  "email": "user@test.com",
  "role": "admin",
  "iat": 1713184200,
  "exp": 1713270600
}
```

**Signature:**
```
HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

## Password Security

### Creating Users

Use `bcrypt` for password hashing:

```javascript
const bcrypt = require('bcrypt');

const password = 'mypassword123';
const saltRounds = 10;

// Hash password
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Store hashedPassword in database (never store plain password!)
```

### Validating Passwords

```javascript
const bcrypt = require('bcrypt');

// When user logs in
const plainPassword = 'mypassword123';
const storedHash = userFromDb.password_hash;

const isValid = await bcrypt.compare(plainPassword, storedHash);
if (isValid) {
  // Password correct, generate token
} else {
  // Password wrong
}
```

## Creating Admin Users

### Via Command Line

```bash
npm run create_admin
# Prompts for email and password

npm run create_moderator
# Create moderator account
```

### Via Script

```bash
cd backend
node scripts/create_admin.js
```

Prompts for:
- Email
- Password (hidden input)
- Role (derived from environment variable `ADMIN_ROLE`)

## Environment Variables

Set in `backend/.env`:

```env
# REQUIRED: JWT signing secret (use strong random string!)
JWT_SECRET=your_secret_key_here_minimum_32_chars_recommended

# Optional: Token expiration (default: 7 days)
JWT_EXPIRATION=7d
```

## Security Best Practices

### DO ✅

- **Use HTTPS in production** - Never send tokens over HTTP
- **Set strong JWT_SECRET** - Use at least 32 characters
  ```bash
  openssl rand -base64 32
  ```
- **Store token securely** - Use secure cookies or secure storage
- **Verify token expiration** - Don't trust expired tokens
- **Hash passwords** - Always use bcrypt, never store plain passwords
- **Rotate secrets regularly** - Plan token refresh strategy
- **Use HTTPS for API** - Protect tokens in transit

### DON'T ❌

- **Don't embed secrets in code** - Use environment variables
- **Don't send tokens in GET parameters** - Use Authorization header
- **Don't store tokens in localStorage for sensitive apps** - Use secure cookies
- **Don't trust client-side validation** - Always validate on server
- **Don't reuse passwords** - Each admin should have unique password
- **Don't expose user info** - Don't return password hash or sensitive data

## Token Refresh (Future Feature)

Currently, tokens don't refresh. Implement for production:

```javascript
// Issue refresh tokens on login
{
  "accessToken": "short_lived_token",
  "refreshToken": "long_lived_token"
}

// When accessToken expires, use refreshToken to get new accessToken
POST /api/auth/refresh
{ "refreshToken": "..." }
```

## Logout

Currently, logout is client-side only:

```javascript
localStorage.removeItem('token');
// or
sessionStorage.removeItem('token');
```

For production, consider:
- Token blacklist (store expired tokens to reject)
- Session management
- Refresh token revocation

## Troubleshooting

### "No auth" Error

**Issue**: Missing Authorization header

**Solution**: Make sure to include token:
```javascript
const config = {
  headers: {
    'Authorization': `Bearer ${token}`
  }
};
axios.get('/api/protected', config);
```

### "Invalid token" Error

**Issue**: Token is malformed or signature invalid

**Solution**: Verify JWT_SECRET matches between token generation and validation

### "Admin only" Error

**Issue**: User doesn't have admin role

**Solution**: Create admin account:
```bash
npm run create_admin
```

### Password Change Not Working

See `../routes/auth.js` for password change implementation. Test with:
```bash
npm run test:change_password
```

## See Also

- `../routes/auth.js` - Authentication endpoint implementation
- `../guide.md` - Backend guide
- `../routes/guide.md` - REST API documentation
