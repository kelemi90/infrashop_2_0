import { NavLink, Outlet } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import QuickCreateItemModal from '../components/QuickCreateItemModal';
import '../styles/layout.css';

export default function Layout() {
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let user = null;
  try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }
  // Quick-create modal moved to a dedicated page. Keep header links as navigation.
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // measure header/footer and publish CSS variables so pages can size to viewport precisely
  useEffect(() => {
    function updateVars() {
      try {
        const headerEl = document.querySelector('.header') || document.querySelector('.site-header');
        const footerEl = document.querySelector('.footer');
        const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
        const footerH = footerEl ? footerEl.getBoundingClientRect().height : 0;
        document.documentElement.style.setProperty('--app-header-height', `${Math.ceil(headerH)}px`);
        document.documentElement.style.setProperty('--app-footer-height', `${Math.ceil(footerH)}px`);
      } catch (e) { /* ignore */ }
    }
    updateVars();
    window.addEventListener('resize', updateVars);
    // Also update after a short delay to allow fonts/layout to settle
    const t = setTimeout(updateVars, 250);
    return () => { window.removeEventListener('resize', updateVars); clearTimeout(t); };
  }, []);

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <NavLink to="/">Vectorama infrashop</NavLink>
          </div>

          <nav className="nav">
            <NavLink to="/" end>Etusivu</NavLink>
            <NavLink to="/items">Tuotteet</NavLink>
            <NavLink to="/order">Tilaus</NavLink>
            <NavLink to="/orders">Tilaukset</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/archive">Arkisto</NavLink>
            {user && user.role === 'admin' && (
              <>
                <NavLink to="/admin" className="nav-multiline">
                  <span>Muokkaa</span>
                  <span className="muted">tuotepaketia</span>
                </NavLink>
                <NavLink to="/admin/items/images" className="admin-btn">Kuvat</NavLink>
                <button className="admin-shortcut" title="Quick create" aria-label="Quick create item" onClick={() => setShowQuickCreate(true)}>+</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      {showQuickCreate && (
        <QuickCreateItemModal onClose={() => setShowQuickCreate(false)} onCreated={() => setShowQuickCreate(false)} />
      )}
    </div>
  );
}
