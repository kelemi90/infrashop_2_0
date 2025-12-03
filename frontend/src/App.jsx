import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Link to="/">Items</Link>
        <Link to="/order">Order</Link>
        <Link to="/admin/archive">Archive</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
