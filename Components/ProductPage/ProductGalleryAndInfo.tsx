// themes/mono/components/ProductPage/ProductGalleryAndInfo.tsx
import React, { useState } from 'react';
import { ProductInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';
import { getMedia } from '../Utils/media';
import ProductPriceDisplay from '../Product/ProductPriceDisplay';
import { RatingStars } from '../Product/FeaturedProductDisplay'; // Réutiliser RatingStars
import { useTranslation } from 'react-i18next';
import { Heart, Share2, MessageSquare, Package, AlertCircle, ShoppingBag } from 'lucide-react';
import { getFileType } from '../Utils/functions';
import { usePageContext } from '../../renderer/usePageContext';
import { useUpdateCart } from '../../api/ReactSublymusApi';
import FeatureSelectorSection from './FeatureSelectorSection';

interface ProductGalleryAndInfoProps {
  product: ProductInterface;
}

const ProductGalleryAndInfo: React.FC<ProductGalleryAndInfoProps> = ({ product }) => {
  const { t } = useTranslation();
  const { storeApiUrl } = usePageContext()
  const updateCartMutation = useUpdateCart();
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);
  const productPageSettings = useThemeSettingsStore(state => state.productPage || DEFAULT_SETTINGS?.productPage);
  const productCardSettings = useThemeSettingsStore(state => state.productCard || DEFAULT_SETTINGS?.productCard);

  const [bind, setBind] = useState({})


  // Gérer la sélection de l'image principale (si plusieurs images dans la variante)
  const defaultFeatureValues = product.features?.find(f => f.id === product.default_feature_id)?.values;
  const allMediaSources = defaultFeatureValues?.[0]?.views || product.features?.[0]?.values?.[0]?.views || [];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const currentMediaSource = allMediaSources[selectedMediaIndex] as string | undefined;
  const currentMedia = currentMediaSource
    ? { url: getMedia({ source: currentMediaSource, from: 'api', host: storeApiUrl }), type: getFileType(currentMediaSource) }
    : { url: '/assets/product-placeholder.png', type: 'image' as 'image' | 'video' };

  const stockInfo = defaultFeatureValues?.[0]?.stock ?? product.stock;
  const showStock = stockInfo !== undefined && stockInfo !== null;
  const stockLevelText = stockInfo !== null && stockInfo !== undefined
    ? (stockInfo > 10 ? t('product.inStock', 'En stock')
      : stockInfo > 0 ? t('product.lowStock', 'Stock faible ({{count}} restants)', { count: stockInfo })
        : t('product.outOfStock', 'Épuisé'))
    : '';
  const stockLevelColor = stockInfo !== null && stockInfo !== undefined
    ? (stockInfo > 10 ? 'text-emerald-600 dark:text-emerald-400'
      : stockInfo > 0 ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400')
    : '';

  const handleAddToCart = () => {
    updateCartMutation.mutate({ product_id: product.id, mode: 'increment', value: 1, bind });
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 xl:gap-12 items-start">
      {/* Galerie d'images/vidéos */}
      <div className='w-full h-full'>
        <div className="product-gallery sticky">
          <div className="main-media aspect-square rounded-lg overflow-hidden shadow-lg mb-3 bg-slate-100 dark:bg-slate-800">
            {currentMedia.type === 'video' && currentMedia.url ? (
              <video src={currentMedia.url} className="w-full h-full object-contain" controls autoPlay muted loop playsInline />
            ) : (
              <img src={currentMedia.url} alt={product.name} className="w-full h-full object-contain" />
            )}
          </div>
          {allMediaSources.length > 1 && (
            <div className="thumbnails grid grid-cols-4 sm:grid-cols-5 gap-2">
              {allMediaSources.map((src, index) => {
                const mediaItem = { url: getMedia({ source: src as string, from: 'api', host: storeApiUrl }), type: getFileType(src as string) };
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`aspect-square rounded overflow-hidden border-2 transition-all 
                              ${index === selectedMediaIndex ? 'border-[' + (generalSettings?.primaryColor || '') + '] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ borderColor: index === selectedMediaIndex ? generalSettings?.primaryColor : 'transparent' }}
                  >
                    {mediaItem.type === 'video' ? (
                      <video src={mediaItem.url} className="w-full h-full object-cover pointer-events-none" muted playsInline />
                    ) : (
                      <img src={mediaItem.url} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Informations du produit et actions */}
      <div className="product-info py-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ fontFamily: generalSettings?.headingFont, color: generalSettings?.textColor }}>
          {product.name}
        </h1>

        {productPageSettings?.showRating && (product.rating > 0 || product.comment_count > 0) && (
          <div className="flex items-center space-x-2 mb-3">
            {product.rating > 0 && <RatingStars rating={product.rating} count={product.comment_count} showCount={false} />}
            {product.comment_count > 0 && (
              <a href="#reviews" className="flex items-center text-xs sm:text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <MessageSquare size="1em" className="mr-1" />
                <span>{product.comment_count} {t('product.reviews', { count: product.comment_count })}</span>
              </a>
            )}
          </div>
        )}

        <ProductPriceDisplay
          price={product.price}
          barredPrice={product.barred_price}
          currency={product.currency || 'XOF'}
          priceColor={productCardSettings?.priceColor || generalSettings?.primaryColor}
          reductionDisplay={productCardSettings?.reductionDisplay}
          className="text-2xl lg:text-3xl font-semibold mb-4"
        />

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4 line-clamp-4 sm:line-clamp-5" style={{ color: generalSettings?.textColor, opacity: 0.8 }}>
          {product.description}
        </p>

        {showStock && (
          <div className={`flex items-center text-sm mb-4 font-medium ${stockLevelColor}`}>
            {stockInfo !== null && stockInfo > 0 ? <Package size="1em" className="mr-1.5" /> : <AlertCircle size="1em" className="mr-1.5" />}
            <span>{stockLevelText}</span>
          </div>
        )}

        {product.features && product.features.length > 1 && ( // Ou si la feature par défaut a plusieurs valeurs
          <FeatureSelectorSection onBindChange={setBind} selectedBind={bind} product={product} />
        )}
        {/* Placeholder pour AddToCartButton - ce composant sera complexe car il dépendra des Features */}
        <div className="mt-6">
          <button
            className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md shadow-md flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: productCardSettings?.addToCartBackgroundColor || generalSettings?.primaryColor,
              color: productCardSettings?.addToCartTextColor || '#FFFFFF',
              borderColor: productCardSettings?.addToCartBorderColor || 'transparent',
            }}
            onClick={() => {
              handleAddToCart()
            }}
            disabled={stockInfo === 0} // Désactiver si hors stock
          >
            <ShoppingBag size={20} className="mr-2" />
            {stockInfo === 0 ? t('product.outOfStockButton', 'Épuisé') : t('product.addToCart', 'Ajouter au panier')}
          </button>
        </div>

        <div className="mt-6 flex items-center space-x-4 text-sm">
          <button className="flex items-center text-slate-600 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
            <Heart size={18} className="mr-1.5" />
            {t('product.addToWishlist', 'Ajouter aux favoris')}
          </button>
          {productPageSettings?.showShareButtons && (
            <button className="flex items-center text-slate-600 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors">
              <Share2 size={18} className="mr-1.5" />
              {t('product.share', 'Partager')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductGalleryAndInfo;