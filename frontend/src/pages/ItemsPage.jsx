import React, { useEffect, useState } from 'react';
import api from '../api';
import ItemCard from '../components/ItemCard';

export default function ItemsPage() {
    const [items, setItems] = useState([]);
    useEffect(()=> {
        api.get('/items'),then(r => setItems(r.data)).catch(console.error);
    }, []);
    return (
        <div>
            <h2>Items</h2>
            <div style={{display: 'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12}}>
                {items.map(it => <ItemCard key={it.id} item={it} />)}
            </div>
        </div>
    );
}