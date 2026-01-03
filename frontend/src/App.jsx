import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import ItemsPage from './pages/ItemsPage';
import ItemDetail from './pages/ItemDetail';
import OrderPage from './pages/OrderPage';
import AdminArchive from './pages/AdminArchive';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/admin/archive" element={<AdminArchive />} />
      </Routes>
    </Layout>
  );
}
