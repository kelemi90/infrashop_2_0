import { useEffect, useMemo, useState } from 'react';
import '../styles/item-modal.css';
import buildImageUrl from '../utils/imageUrl';

export default function ItemModal({ item, onClose }) {
    const imageList = useMemo(() => {
        if (item && Array.isArray(item.image_urls) && item.image_urls.length > 0) return item.image_urls;
        if (item && item.image_url) return [item.image_url];
        return [null];
    }, [item]);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [item?.id]);

    const imageSrc = buildImageUrl(imageList[currentIndex]);
    const canCycle = imageList.length > 1;

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>x</button>

                <h2>{item.name}</h2>

                <div className="modal-gallery-main">
                    {canCycle && (
                        <button className="modal-gallery-arrow left" onClick={goPrev} aria-label="Edellinen kuva">
                            ‹
                        </button>
                    )}

                    <img
                        className="modal-main-image"
                        src={imageSrc}
                        alt={item.name}
                        onError={(e) => {
                            if (!e.target.dataset.fallback) {
                                e.target.dataset.fallback = '1';
                                e.target.src = buildImageUrl(null);
                            } else {
                                e.target.style.display = 'none';
                            }
                        }}
                    />

                    {canCycle && (
                        <button className="modal-gallery-arrow right" onClick={goNext} aria-label="Seuraava kuva">
                            ›
                        </button>
                    )}
                </div>

                {canCycle && (
                    <div className="modal-gallery-thumbs">
                        {imageList.map((img, idx) => {
                            if (idx === currentIndex) return null;
                            return (
                                <button
                                    type="button"
                                    key={`${img}-${idx}`}
                                    className="modal-thumb-btn"
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`Näytä kuva ${idx + 1}`}
                                >
                                    <img className="modal-thumb-image" src={buildImageUrl(img)} alt={`${item.name} ${idx + 1}`} />
                                </button>
                            );
                        })}
                    </div>
                )}

                                <p className="item-short">{item.short_description}</p>
                                {item.long_description && (
                                    <div className="item-long">
                                        <h4>Lisätiedot</h4>
                                        <p>{item.long_description}</p>
                                    </div>
                                )}

                <div className="stock">Varastossa: {item.available_stock}</div>
            </div>
        </div>
    );
}