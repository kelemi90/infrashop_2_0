import { Link } from 'react-router-dom';
import '../styles/layout.css';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <Link to="/">InfraShop</Link>
          </div>

          <nav className="nav">
            <Link to="/">Tuotteet</Link>
            <Link to="/order">Tilaus</Link>
            <Link to="/admin/archive">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="main">
        {children}
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} InfraShop</span>
      </footer>
    </div>
  );
}
