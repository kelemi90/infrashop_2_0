import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function ItemDetail(){
    const { id } = useParams();
    const [item, setItem] = useState(null);
    useEffect(()=> {
        api.get('/items/${id}').then(r => setItem(r.data).catch(console.error));
    }, [id]);
    if(!item) return <div>Loading...</div>
    return (
        <div>
            <h2>{item.name}</h2>
            {item.image_url && <img src={item.image_url} alt={item.name} style={{maxWidth:480}} />}
            <p>{item.long_description || item.short_description}</p>
            <div>Available: {item.available_stock}</div>
        </div>
    );
}