import { Link } from 'react-router-dom';
import '../styles/home.css';
import { canManageCatalog, isAdmin } from '../utils/roles';

export default function HomePage() {
  const loggedIn = (typeof window !== 'undefined') && Boolean(sessionStorage.getItem('token'));
  let user = null;
  try { user = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || 'null') : null; } catch (e) { user = null; }
  const canManage = canManageCatalog(user);
  const adminOnly = isAdmin(user);

  const cards = [
    {
      key: 'items',
      to: '/items',
      title: 'Tuotteet',
      description: 'Selaa laitteet ja tarvikkeet tuoteryhmittäin'
    },
    {
      key: 'order',
      to: '/order',
      title: 'Tee tilaus',
      description: 'Valitse tuotteet tai valmiit tuotepaketit'
    },
    {
      key: 'orders',
      to: '/orders',
      title: 'Tilaukset',
      description: 'Tehdyt tilaukset'
    },
    {
      key: 'admin-groups',
      to: '/admin',
      title: 'Muokkaa tuoteryhmiä',
      description: 'Muokkaa item-ryhmiä ja paketteja',
      catalogManagerOnly: true
    },
    {
      key: 'admin-events',
      to: '/admin/events',
      title: 'Luo tapahtuma',
      description: 'Luo uusi tapahtuma, johon tilaukset kohdistetaan (Admin)',
      adminOnly: true
    },
    {
      key: 'admin-images',
      to: '/admin/items/images',
      title: 'Kuvat',
      description: 'Muokkaa tuotteiden kuvia ja tietoja',
      catalogManagerOnly: true
    },
    {
      key: 'change-password',
      to: '/change-password',
      title: 'Vaihda salasana',
      description: 'Vaihda oma ylläpitäjän tai moderaattorin salasana',
      catalogManagerOnly: true,
      loggedInOnly: true
    },
    {
      key: 'archive',
      to: '/archive',
      title: 'Arkisto',
      description: 'Aiemmat tapahtumat ja tilaukset'
    },
    {
      key: 'login',
      to: '/login',
      title: 'Kirjaudu',
      description: 'Kirjaudu sisään ylläpito- ja muokkaustoimintoja varten',
      loggedOutOnly: true
    },
    {
      key: 'logout',
      title: 'Kirjaudu ulos',
      description: 'Kirjaudu ulos järjestelmästä',
      loggedInOnly: true,
      onClick: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.reload();
      }
    }
  ];

  const visibleCards = cards.filter((card) => {
    if (card.adminOnly && !adminOnly) return false;
    if (card.catalogManagerOnly && !canManage) return false;
    if (card.loggedOutOnly && loggedIn) return false;
    if (card.loggedInOnly && !loggedIn) return false;
    return true;
  });

  return (
    <div className="home-page">
      <h1 className="home-title">Vectorama infrashop</h1>
      <p className="home-subtitle">
        Laitteet ja tarvikkeet tapahtumia varten
      </p>

      <div className="home-grid">
        {visibleCards.map((card) => {
          if (card.to) {
            return (
              <Link key={card.key} to={card.to} className="home-card">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </Link>
            );
          }

          return (
            <div key={card.key} className="home-card home-card-clickable" onClick={card.onClick}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
