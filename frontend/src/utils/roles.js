export const ROLE_ADMIN = 'admin';
export const ROLE_MODERATOR = 'moderator';

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

export function isAdmin(user) {
  return hasRole(user, [ROLE_ADMIN]);
}

export function canManageCatalog(user) {
  return hasRole(user, [ROLE_ADMIN, ROLE_MODERATOR]);
}