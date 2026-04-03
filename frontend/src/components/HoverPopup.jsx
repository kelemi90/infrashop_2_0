import React from 'react';
import buildImageUrl from '../utils/imageUrl';

export default function HoverPopup({ item }) {
    return (
        <div className="hover-popup">
            {item.image_url ? (
                <img src={buildImageUrl(item.image_url)} alt={item.name} className="hover-popup-image" />
            ) : null}
            <div className="hover-popup-description">{item.short_description}</div>
        </div>
    );
}