export const ROLE_ADMIN = 'admin';
export const ROLE_MODERATOR = 'moderator';

function decodeJwtPayload(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function getSessionUser() {
  if (typeof window === 'undefined') return null;

  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch (e) {
    user = null;
  }

  const token = sessionStorage.getItem('token');
  const payload = decodeJwtPayload(token);
  const tokenRole = payload && typeof payload.role === 'string' ? payload.role : null;
  const tokenId = payload && payload.id !== undefined ? payload.id : null;

  if (!user && !payload) return null;

  return {
    ...(user || {}),
    id: (user && user.id !== undefined) ? user.id : tokenId,
    role: (user && user.role) ? user.role : tokenRole
  };
}

export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role));
}

export function isAdmin(user) {
  return hasRole(user, [ROLE_ADMIN]);
}

export function canManageCatalog(user) {
  return hasRole(user, [ROLE_ADMIN, ROLE_MODERATOR]);
}