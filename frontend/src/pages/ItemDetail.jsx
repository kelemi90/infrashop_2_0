import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import buildImageUrl from '../utils/imageUrl';

export default function ItemDetail() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        api
            .get(`/items/${id}`)
            .then((r) => setItem(r.data))
            .catch(console.error);
    }, [id]);

    if (!item) return <div>Loading...</div>;
    const imageUrls = (item && item.image_urls && item.image_urls.length)
        ? item.image_urls
        : (item && item.image_url ? [item.image_url] : []);
    const safeIndex = Math.min(activeImage, Math.max(imageUrls.length - 1, 0));
    const currentImage = imageUrls[safeIndex] || null;
    const imageSrc = buildImageUrl(currentImage);

    return (
        <div>
            <h2>{item.name}</h2>
            <img
                src={imageSrc}
                alt={item.name}
                className="item-detail-main-image"
                onError={(e) => {
                    if (!e.target.dataset.fallback) {
                        e.target.dataset.fallback = '1';
                        e.target.src = buildImageUrl(null);
                    } else {
                        e.target.style.display = 'none';
                    }
                }}
            />
            {imageUrls.length > 1 && (
                <div className="item-detail-thumbs">
                    {imageUrls.map((img, idx) => (
                        <img
                            key={`${img}-${idx}`}
                            src={buildImageUrl(img)}
                            alt={`${item.name} ${idx + 1}`}
                            onClick={() => setActiveImage(idx)}
                            className={`item-detail-thumb ${idx === safeIndex ? 'item-detail-thumb-active' : ''}`}
                        />
                    ))}
                </div>
            )}
            <p>{item.long_description || item.short_description}</p>
            <div>Available: {item.available_stock}</div>
        </div>
    );
}