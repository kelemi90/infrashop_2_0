import { NavLink, Outlet } from 'react-router-dom';
import '../styles/layout.css';

export default function Layout() {
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
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
