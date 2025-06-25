// components/Product/ImageGallery.tsx

import React from 'react';
import { getMedia } from '../Utils/media';

interface ImageGalleryProps {
  images: string[];
  layout: 'grid' | 'carousel';
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, layout }) => {
  if (images.length === 0) {
    return <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">No Image</div>;
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {images.map((img, index) => (
          <div key={index} className={`aspect-square rounded-lg overflow-hidden ${index === 0 ? 'col-span-2' : ''}`}>
            <img src={getMedia({ source: img, from: 'api' })} alt={`Product view ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // TODO: Implémenter la logique du carrousel (avec Swiper.js par exemple)
  return <div>Carousel Layout Coming Soon</div>;
};