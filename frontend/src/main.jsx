import React from 'react';
import { createRoot } from 'react-dom/client',
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ItemsPage from './pages/ItemsPage';
import ItemDetail from './pages/ItemDetail';
import OrderPage from './pages/OrderPage';
import AdminArchive from './pages/AdminArchive';

createRoot(document.getElementById('roolt')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                <Route index element={<ItemsPage />} />
                <Route path="items/:id" element={<ItemDetail />} />
                <Route path="order" element={<OrderPage />} />
                <Route path="admin/archive" element={<AdminArchive />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);