import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasRole } from '../utils/roles';

// Wrap admin routes with this component. Behavior:
// - If not logged in -> show message then redirect to /login
// - If logged in but not allowed -> show message then redirect to /archive
// - If allowed -> render children
export default function RequireAdmin({ children, allowedRoles = ['admin'] }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | redirecting

  let user = null;
  try { user = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || 'null') : null; } catch (e) { user = null; }

  useEffect(() => {
    if (status !== 'checking') return;

    if (!user) {
      setStatus('redirecting');
      // show message briefly, then navigate to login
      const t = setTimeout(() => navigate('/login', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    if (!hasRole(user, allowedRoles)) {
      setStatus('redirecting');
      const t = setTimeout(() => navigate('/archive', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    // admin: do nothing, allow render
    setStatus('ok');
  }, [allowedRoles, user, navigate, status]);

  if (status === 'ok') return children;

  // While redirecting, show a friendly message
  const msg = !user ? 'Please login — redirecting to login page' : (!hasRole(user, allowedRoles) ? 'Required access missing — redirecting to archive' : 'Preparing...');

  return (
    <div className="require-admin-wrap">
      <div className="require-admin-card">
        <p className="require-admin-message">{msg}</p>
      </div>
    </div>
  );
}
