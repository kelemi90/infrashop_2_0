import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import React, { useState } from 'react';
import QuickCreateItemModal from './QuickCreateItemModal';
import '../styles/header.css';
import { canManageCatalog } from '../utils/roles';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const userJson = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  let user = null;
  try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }

  const getPageTitle = () => {
    if (location.pathname.startsWith('/items')) return 'Tuotteet';
    if (location.pathname.startsWith('/order')) return 'Tilaus';
    if (location.pathname.startsWith('/orders')) return 'Tilaukset';
    /* if (location.pathname.startsWith('/admin')) return 'Muokkaa'; */
    if (location.parhname.startsWith('/reports')) return 'Reports';
    if (location.pathname.startsWith('/archive')) return 'Arkisto';
    return '';
  };

  return (
    <header className="site-header">
      <div className="header-left">
        <Link to="/" className="site-name">InfraShop</Link>
      </div>

      <nav className="header-nav">
        <Link to="/items">Tuotteet</Link>
        <Link to="/order">Tilaus</Link>
        <Link to="/orders">Tilaukset</Link>
        <Link to="/archive">Arkisto</Link>
        {canManageCatalog(user) && (
          <>
            <NavLink to="/admin">Muokkaa</NavLink>
            <NavLink to="/admin/items/images" className="admin-btn">Kuvat</NavLink>
            <NavLink to="/change-password" className="admin-compact-btn">Salasana</NavLink>
            {/* <NavLink to="/admin/items/new" className="admin-btn">Uusi tuote</NavLink> */}
            <button className="admin-shortcut" title="Quick create" aria-label="Quick create item" onClick={() => setShowQuickCreate(true)}>+</button>
          </>
        )}
      </nav>

      <div className="header-right">
        <span className="page-title">{getPageTitle()}</span>
        {user ? (
          <div className="header-user-wrap">
            <span className="header-user-name">{user.display_name || user.email || user.id}</span>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="header-login-link">Login</Link>
        )}
      </div>
      {showQuickCreate && (
        <QuickCreateItemModal onClose={() => setShowQuickCreate(false)} onCreated={() => setShowQuickCreate(false)} />
      )}
    </header>
  );
}
