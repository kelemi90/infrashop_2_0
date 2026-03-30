import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';

export default function ItemDetail() {
    const { id } = useParams();
    const [item, setItem] = useState(null);

    useEffect(() => {
        api
            .get(`/items/${id}`)
            .then((r) => setItem(r.data))
            .catch(console.error);
    }, [id]);

    if (!item) return <div>Loading...</div>;
    const imageSrc = buildImageUrl(item && item.image_url);

    return (
        <div>
            <h2>{item.name}</h2>
            <img
                src={imageSrc}
                alt={item.name}
                style={{ maxWidth: 480 }}
                onError={(e) => {
                    e.target.src = buildImageUrl(null);
                }}
            />
            <p>{item.long_description || item.short_description}</p>
            <div>Available: {item.available_stock}</div>
        </div>
    );
}