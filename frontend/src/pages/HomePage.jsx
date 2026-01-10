import { Link } from 'react-router-dom';
import '../styles/home.css';

export default function HomePage() {
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

        <Link to="/reports" className="home-card">
          <h2>Reports</h2>
          <p>Tutki tilauksia</p>
        </Link>

        <Link to="/archive" className="home-card">
          <h2>Arkisto</h2>
          <p>Aiemmat tapahtumat ja tilaukset</p>
        </Link>
      </div>
    </div>
  );
}
