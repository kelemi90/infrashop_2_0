import { defineConfig } from 'vite';
import react from '@viteks/plugin-react';

export default defineConfig({
    base: '/test/', // <-- tärkeä lisäys, tällä hetkellä frontendin testiversiolle oma polku
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});