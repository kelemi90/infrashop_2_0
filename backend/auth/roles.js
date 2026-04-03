const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

const ROLE_ADMIN = 'admin';
const ROLE_MODERATOR = 'moderator';

function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRoles(allowedRoles, errorMessage = 'Forbidden') {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!hasRole(req.user, allowedRoles)) {
        return res.status(403).json({ error: errorMessage });
      }
      next();
    });
  };
}

const requireAdmin = requireRoles([ROLE_ADMIN], 'Admin only');
const requireCatalogManager = requireRoles([ROLE_ADMIN, ROLE_MODERATOR], 'Moderator or admin required');

module.exports = {
  ROLE_ADMIN,
  ROLE_MODERATOR,
  auth,
  hasRole,
  requireAdmin,
  requireCatalogManager,
  requireRoles
};