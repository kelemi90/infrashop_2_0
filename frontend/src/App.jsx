import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import ItemDetail from './pages/ItemDetail';
import OrderPage from './pages/OrderPage';
import Admin from './pages/Admin';
import AdminGroups from './pages/AdminGroups';
import ItemImageEdit from './pages/ItemImageEdit';
import NewItem from './pages/NewItem';
import GroupEdit from './pages/GroupEdit';
import RequireAdmin from './components/RequireAdmin';
import ArchivePage from './pages/ArchivePage';
import OrdersPage from './pages/OrdersPage';
import EditOrderPage from './pages/EditOrderPage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';
import AdminEvents from './pages/AdminEvents';
import GroupsPage from './pages/GroupsPage';
import { ROLE_ADMIN, ROLE_MODERATOR } from './utils/roles';

export default function App() {
  return (
    <Routes>
      {/* Etusivu ilman layoutia */}
      <Route path="/" element={<HomePage />} />

      {/* Kaikki muut sivut layoutin sisällä */}
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/order" element={<OrderPage />} />
  <Route path="/groups" element={<GroupsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        {/* <Route path="/orders/:id/edit" element={<EditOrderPage />} /> */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/admin" element={<RequireAdmin allowedRoles={[ROLE_ADMIN, ROLE_MODERATOR]}><AdminGroups /></RequireAdmin>} />
        <Route path="/admin/events" element={<RequireAdmin><AdminEvents /></RequireAdmin>} />
        <Route path="/admin/archive" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/admin/items/images" element={<RequireAdmin allowedRoles={[ROLE_ADMIN, ROLE_MODERATOR]}><ItemImageEdit /></RequireAdmin>} />
        <Route path="/admin/items/new" element={<RequireAdmin allowedRoles={[ROLE_ADMIN, ROLE_MODERATOR]}><NewItem /></RequireAdmin>} />
        <Route path="/admin/groups/:id/edit" element={<RequireAdmin allowedRoles={[ROLE_ADMIN, ROLE_MODERATOR]}><GroupEdit /></RequireAdmin>} />
      </Route>
    </Routes>
  );
}
