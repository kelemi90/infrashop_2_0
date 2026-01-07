import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import ItemDetail from './pages/ItemDetail';
import OrderPage from './pages/OrderPage';
import AdminArchive from './pages/AdminArchive';
import Layout from './components/Layout';

export default function App() {
  return (
    <Routes>
      {/* Etusivu ilman layoutia */}
      <Route path="/" element={<HomePage />} />

      {/* Kaikki muut sivut layoutin sisällä */}
      <Route element={<Layout />}>
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/archive" element={<AdminArchive />} />
      </Route>
    </Routes>
  );
}
