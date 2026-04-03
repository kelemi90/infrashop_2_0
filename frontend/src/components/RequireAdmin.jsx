import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

// Wrap admin routes with this component. Behavior:
// - If not logged in -> show message then redirect to /login
// - If logged in but not admin -> show message then redirect to /archive
// - If admin -> render children
export default function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | redirecting

  let user = null;
  try { user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null; } catch (e) { user = null; }

  useEffect(() => {
    if (status !== 'checking') return;

    if (!user) {
      setStatus('redirecting');
      // show message briefly, then navigate to login
      const t = setTimeout(() => navigate('/login', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    if (user.role !== 'admin') {
      setStatus('redirecting');
      const t = setTimeout(() => navigate('/archive', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    // admin: do nothing, allow render
    setStatus('ok');
  }, [user, navigate, status]);

  if (status === 'ok') return children;

  // While redirecting, show a friendly message
  const msg = !user ? 'Please login — redirecting to login page' : (user.role !== 'admin' ? 'Admin access required — redirecting to archive' : 'Preparing...');

  return (
    <div className="require-admin-wrap">
      <div className="require-admin-card">
        <p className="require-admin-message">{msg}</p>
      </div>
    </div>
  );
}
