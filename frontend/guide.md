# Frontend Guide

A modern React/Vite single-page application for the InfraShop order management system.

## Structure

```
frontend/
├── package.json                 # Dependencies and build scripts
├── vite.config.mjs              # Vite build configuration
├── Dockerfile                   # Container image for production
├── default.conf                 # Nginx configuration for serving
├── index.html                   # HTML entry point
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Main app component
│   ├── api.js                   # API client (axios wrapper)
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Layout.jsx
│   │   ├── ItemCard.jsx
│   │   ├── EditOrderModal.jsx
│   │   ├── QuickCreateItemModal.jsx
│   │   └── ...
│   ├── pages/                   # Page components (one per route)
│   │   ├── LoginPage.jsx
│   │   ├── HomePage.jsx         # Main product listing
│   │   ├── ItemsPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── ItemDetail.jsx
│   │   ├── EditOrderPage.jsx
│   │   ├── GroupsPage.jsx
│   │   ├── Admin.jsx
│   │   ├── AdminArchive.jsx
│   │   ├── AdminEvents.jsx
│   │   ├── AdminGroups.jsx
│   │   └── ...
│   ├── styles/                  # CSS stylesheets
│   │   ├── global.css
│   │   ├── home.css
│   │   ├── item-card.css
│   │   ├── order.css
│   │   ├── admin.css
│   │   └── ...
│   └── utils/                   # Utility functions
│       ├── imageUrl.js          # Image URL builder
│       └── roles.js             # Role/permission helpers
```

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create .env File (Optional)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=InfraShop
```

### 3. Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` (Vite default port)

### 4. Build for Production

```bash
npm run build
```

Generates optimized files in `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

Test the production build locally.

## Available Scripts

```bash
npm run dev           # Start development server with hot reload
npm run build         # Build optimized production bundle
npm run preview       # Preview production build locally
npm run lint          # Run ESLint (if configured)
```

## Key Features

### 1. Authentication

- Login/register system using JWT
- Role-based access (admin, moderator, customer)
- Protected routes based on user role
- Token stored in localStorage

**Login Flow:**
```javascript
POST /api/auth/login
{ "email": "user@example.com", "password": "password123" }
→ Returns JWT token
```

See `pages/LoginPage.jsx` for implementation.

### 2. Product Catalog

**Main Pages:**
- `pages/HomePage.jsx` - Main product listing with filtering
- `pages/ItemsPage.jsx` - Detailed items list
- `pages/ItemDetail.jsx` - Single item details with image gallery

**Components:**
- `components/ItemCard.jsx` - Product display card
- `components/HoverPopup.jsx` - Quick preview on hover

**Features:**
- Grid/list view toggle
- Filtering by category
- Search functionality
- Stock availability display
- Quick add to cart

### 3. Order Management

**Create Orders:**
- `pages/HomePage.jsx` - Create order from product page
- `components/QuickCreateItemModal.jsx` - Quick order modal
- `pages/NewItem.jsx` - Create new item (admin)

**View Orders:**
- `pages/OrdersPage.jsx` - List all user's orders
- `pages/OrderPage.jsx` - Single order details/edit
- `components/EditOrderModal.jsx` - Edit order items

**Edit Orders:**
- Change quantities
- Add/remove items
- Update delivery info
- Track order status

See `pages/EditOrderPage.jsx` for implementation.

### 4. Admin Features

**Dashboard:**
- `pages/Admin.jsx` - Main admin dashboard
- `pages/AdminEvents.jsx` - Manage events
- `pages/AdminGroups.jsx` - Manage item groups
- `pages/AdminArchive.jsx` - View archived orders
- `pages/ReportsPage.jsx` - Business reports

**Permissions:**
- Only users with `admin` role can access
- Protected by `components/RequireAdmin.jsx`

### 5. Utilities

**API Client** (`src/api.js`):
```javascript
import api from '../api';

// All API calls go through this
api.get('/items')
api.post('/orders', { data })
api.patch('/orders/1', { updates })
```

**Image URLs** (`src/utils/imageUrl.js`):
```javascript
import buildImageUrl from '../utils/imageUrl';

// Handles image URL construction with fallbacks
<img src={buildImageUrl(imageUrl)} />
```

**Roles** (`src/utils/roles.js`):
```javascript
// Helper functions for role checking
canEditItem(user)
canDeleteOrder(user)
```

## Styling

### CSS Organization

- `global.css` - Global styles, variables, reset
- Component-specific `.css` files - One CSS file per component
- `admin.css`, `order.css`, `item-card.css`, etc.

### Variables

Common CSS variables defined in `global.css`:

```css
--primary-color: #007bff;
--danger-color: #dc3545;
--spacing-unit: 8px;
--border-radius: 4px;
```

### Responsive Design

All components use responsive CSS with media queries:

```css
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}
```

## API Integration

### Making Requests

```javascript
import api from '../api';

// GET
const response = await api.get('/items');

// POST
await api.post('/orders', {
  event_id: 1,
  customer_name: 'John Doe',
  items: [{ item_id: 1, quantity: 2 }]
});

// PATCH
await api.patch('/orders/1', {
  status: 'returned',
  items: [{ item_id: 1, quantity: 3 }]
});
```

### Error Handling

```javascript
try {
  const response = await api.get('/items');
  setItems(response.data);
} catch (err) {
  setError(err.response?.data?.error || 'Request failed');
}
```

### Update API Base URL

Edit in `src/api.js` or environment variable:

```javascript
// src/api.js
const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
});
```

## State Management

Currently using React hooks:

```javascript
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

useEffect(() => {
  fetchItems();
}, []);
```

For larger app, consider Redux or Zustand.

## Routing

React Router setup (in `App.jsx`):

```javascript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/orders" element={<OrdersPage />} />
    <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
  </Routes>
</BrowserRouter>
```

## Development Tips

### Hot Module Replacement

Vite automatically reloads on file changes. Just save your file!

### Debug API Calls

Browser DevTools → Network tab to see all requests/responses.

### Debug React Components

Install React Developer Tools browser extension to inspect component state.

### Console Logging

```javascript
console.log('Debug:', variable);  // Visible in browser console
```

Clear in production.

## Deployment

### Docker

Build image:
```bash
docker build -t infrashop-frontend .
```

Run container:
```bash
docker run -p 3000:80 infrashop-frontend
```

### Static Hosting

After `npm run build`, deploy `dist/` folder to:
- Static hosting (Netlify, Vercel, GitHub Pages)
- Nginx server
- Apache
- Cloud storage (S3, GCS)

### Environment Variables

Set before build:
```bash
VITE_API_BASE_URL=https://api.example.com npm run build
```

## Troubleshooting

### "Cannot find module 'api'"

**Issue**: Import path incorrect

**Solution**: Check path relative to current file:
```javascript
// If in src/pages/, use:
import api from '../api';

// If in src/components/, use:
import api from '../api';
```

### API calls failing with CORS error

**Issue**: Backend doesn't allow frontend origin

**Solution**: Configure CORS in backend (`server.js`):
```javascript
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

### Images not loading

**Issue**: Image URL construction might be wrong

**Solution**: Check `utils/imageUrl.js` and verify backend serves images correctly.

### Build fails with memory error

**Issue**: Vite needs more memory

**Solution**:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

## Performance

### Production Build Size

```bash
npm run build
# Check dist/ folder size
du -sh dist/

# Analyze bundle (with webpack-bundle-analyzer)
npm add -D webpack-bundle-analyzer
```

### Optimization Tips

1. **Lazy load pages**: Use `React.lazy()` for routes
2. **Code splitting**: Vite does this automatically
3. **Image optimization**: Resize images before upload
4. **Cache API responses**: Implement caching strategy
5. **Minify CSS**: Vite does this in production build

## See Also

- `../backend/guide.md` - Backend API documentation
- `../backend/routes/guide.md` - REST API endpoints
- `../docker-compose.yml` - Full stack local development
- `default.conf` - Nginx configuration for serving frontend
