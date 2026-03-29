import { Link } from 'react-router-dom';
import '../styles/home.css';

export default function HomePage() {
  const loggedIn = (typeof window !== 'undefined') && Boolean(localStorage.getItem('token'));
  let user = null;
  try { user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null; } catch (e) { user = null; }

  return (
    <div className="home-page">
      <h1 className="home-title">Vectorama infrashop</h1>
      <p className="home-subtitle">
        Laitteet ja tarvikkeet tapahtumia varten
      </p>

      <div className="home-grid">
        <Link to="/items" className="home-card">
          <h2>Tuotteet</h2>
          <p>Selaa laitteet ja tarvikkeet tuoteryhmittäin</p>
        </Link>

        <Link to="/order" className="home-card">
          <h2>Tee tilaus</h2>
          <p>Valitse tuotteet tai valmiit tuotepaketit</p>
        </Link>

        <Link to="/orders" className="home-card">
          <h2>Tilaukset</h2>
          <p>Tehdyt tilaukset</p>
        </Link>

        {user && user.role === 'admin' ? (
          <Link to="/admin" className="home-card">
            <h2>Muokkaa tuoteryhmiä</h2>
            <p>Muokkaa item-ryhmiä ja paketteja (Admin)</p>
          </Link>
        ) : null}

        <Link to="/archive" className="home-card">
          <h2>Arkisto</h2>
          <p>Aiemmat tapahtumat ja tilaukset</p>
        </Link>

        {!loggedIn && (
          <Link to="/login" className="home-card">
            <h2>Kirjaudu</h2>
            <p>Kirjaudu sisään ylläpito- ja muokkaustoimintoja varten</p>
          </Link>
        )}

        {loggedIn && user && user.role === 'admin' && (
          <div className="home-card" style={{ cursor: 'pointer' }} onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }}>
            <h2>Kirjaudu ulos</h2>
            <p>Kirjaudu ulos järjestelmästä</p>
          </div>
        )}
      </div>
    </div>
  );
}
