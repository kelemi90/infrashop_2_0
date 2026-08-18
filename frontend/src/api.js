import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

// attach token if present (only from sessionStorage for better security)
api.interceptors.request.use(cfg => {
    const t = sessionStorage.getItem('token');
    if (t) {
        cfg.headers.Authorization = `Bearer ${t}`;
    }
    
    // Support order-specific token from URL or state
    const orderToken = sessionStorage.getItem('order_token');
    if (orderToken && !cfg.params?.token) {
        cfg.params = { ...cfg.params, token: orderToken };
    }
    
    return cfg;
});

export default api;
