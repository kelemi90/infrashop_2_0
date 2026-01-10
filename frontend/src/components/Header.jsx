import { Link, useLocation } from 'react-router-dom';
import '../styles/header.css';

export default function Header() {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/items')) return 'Tuotteet';
    if (location.pathname.startsWith('/order')) return 'Tilaus';
    if (location.pathname.startsWith('/orders')) return 'Tilaukset';
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
      </nav>

      <div className="header-right">
        <span className="page-title">{getPageTitle()}</span>
      </div>
    </header>
  );
}
