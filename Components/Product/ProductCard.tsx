// themes/mono/components/Product/ProductCard.tsx
import React from 'react';
import { ProductInterface } from '../../Interfaces/Interfaces'; // Ajuste le chemin
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore'; // Ajuste le chemin
import { getMedia } from '../Utils/media'; // Ajuste le chemin
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductPriceDisplay from './ProductPriceDisplay'; // Réutiliser ce composant
import { RatingStars } from './FeaturedProductDisplay'; // Réutiliser ce composant
import { usePageContext } from '../../renderer/usePageContext';

interface ProductCardProps {
  product: ProductInterface;
  className?: string; // Pour des classes additionnelles depuis le parent
}

export const ProductCard = ({ product, className }:ProductCardProps) => {
  const { t } = useTranslation();
  const {storeApiUrl} = usePageContext()
  const cardSettings = useThemeSettingsStore(state => state.productCard || DEFAULT_SETTINGS?.productCard);
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);
  
  const getProductImageUrl = (p: ProductInterface): string | undefined => {
    const defaultFeature = p.features?.find(f => f.id === p.default_feature_id);
    const firstImageFromDefaultFeature = defaultFeature?.values?.[0]?.views?.[0];
    if (firstImageFromDefaultFeature) return getMedia({ source: firstImageFromDefaultFeature as string, from: 'api', host: storeApiUrl });

    const firstImageFromAnyFeature = p.features?.[0]?.values?.[0]?.views?.[0];
    if (firstImageFromAnyFeature) return getMedia({ source: firstImageFromAnyFeature as string, from: 'api', host: storeApiUrl });
    
    return '/assets/product-placeholder.png'; // Placeholder global
  };

  const imageUrl = getProductImageUrl(product);
  const isDarkMode = generalSettings?.darkMode?.enabled;

  // Déterminer la couleur de texte principale en fonction du mode sombre et des settings
  const textColor = isDarkMode 
    ? (cardSettings?.textColor || generalSettings?.darkMode?.textColor || DEFAULT_SETTINGS?.general?.darkMode?.textColor)
    : (cardSettings?.textColor || generalSettings?.textColor || DEFAULT_SETTINGS?.general?.textColor);

  // Déterminer la couleur de fond principale en fonction du mode sombre et des settings
  const backgroundColor = isDarkMode
    ? (cardSettings?.backgroundColor || generalSettings?.darkMode?.backgroundColor || DEFAULT_SETTINGS?.general?.darkMode?.backgroundColor)
    : (cardSettings?.backgroundColor || generalSettings?.backgroundColor || DEFAULT_SETTINGS?.general?.backgroundColor);


  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche la navigation si le bouton est dans un lien
    e.stopPropagation();
    // TODO: Implémenter la logique d'ajout/suppression des favoris
    // const { user, token } = useAuthStore.getState();
    // if (!user || !token) { openAuthModal('login'); return; }
    // addOrRemoveFavoriteMutation.mutate({ productId: product.id });
    console.log('Toggle favorite for product:', product.id);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Si produit simple (pas de features à choisir), ajouter directement.
    // Sinon, ouvrir un modal de sélection de features ou rediriger vers la page produit.
    // Pour un thème "Mono" avec peu de produits, ils sont peut-être souvent simples.
    // useCartStore.getState().addItem(...) ou useUpdateCart().mutate(...)
    console.log('Add to cart:', product.id);
    // Pour un MVP, on pourrait juste naviguer vers la page produit pour les options.
    // navigate(`/products/${product.slug}`);
  };

  return (
    <a
      href={`/${product.slug}`}
      className={`group flex flex-col rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ease-in-out ${className}`}
      style={{ backgroundColor: backgroundColor, color: textColor }}
      aria-label={`${t('product.viewDetailsFor', 'Voir les détails pour')} ${product.name}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy" // Lazy loading pour les images dans les listes
          />
        )}
        {cardSettings?.favoriteIconPosition && cardSettings?.favoriteIconPosition !== 'none' && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute z-10 p-1.5 sm:p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-full shadow
                        hover:bg-white dark:hover:bg-slate-800 transition-colors
                        ${cardSettings?.favoriteIconPosition === 'top-right' ? 'top-2 right-2 sm:top-3 sm:right-3' : ''}
                        ${cardSettings?.favoriteIconPosition === 'bottom-right' ? 'bottom-2 right-2 sm:bottom-3 sm:right-3' : ''}
                        ${cardSettings?.favoriteIconPosition === 'top-left' ? 'top-2 left-2 sm:top-3 sm:left-3' : ''}
                        ${cardSettings?.favoriteIconPosition === 'bottom-left' ? 'bottom-2 left-2 sm:bottom-3 sm:left-3' : ''}
                        `}
            aria-label={t('product.toggleFavorite', 'Ajouter/Retirer des favoris')}
          >
            <Heart size={16} className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400" />
            {/* Ajouter une classe 'fill-red-500' si le produit est déjà en favori */}
          </button>
        )}
      </div>

      <div className="flex flex-col flex-grow p-3 sm:p-4">
        {/* Gérer l'ordre prix/nom selon settings?.productCard.priceBeforeName */}
        {cardSettings?.priceBeforeName && (
          <ProductPriceDisplay
            price={product.price}
            barredPrice={product.barred_price}
            currency={product.currency || 'XOF'}
            priceColor={cardSettings?.priceColor || generalSettings?.primaryColor}
            reductionDisplay={cardSettings?.reductionDisplay}
            className="text-md sm:text-lg mb-1"
          />
        )}

        <h4
          className="text-sm sm:text-base font-semibold flex-grow line-clamp-2 group-hover:underline" // flex-grow pour pousser le prix en bas si nom court
          style={{ fontFamily: generalSettings?.headingFont }}
          title={product.name}
        >
          {product.name}
        </h4>

        {!cardSettings?.priceBeforeName && (
          <ProductPriceDisplay
            price={product.price}
            barredPrice={product.barred_price}
            currency={product.currency || 'XOF'}
            priceColor={cardSettings?.priceColor || generalSettings?.primaryColor}
            reductionDisplay={cardSettings?.reductionDisplay}
            className="text-md sm:text-lg mt-1" // mt-1 si nom avant, mb-1 si prix avant
          />
        )}

        {cardSettings?.showRating && (product.rating > 0 || product.comment_count > 0) && (
          <div className="mt-1.5 flex items-center">
            <RatingStars rating={product.rating || 0} count={product.comment_count || 0} showCount={true} />
          </div>
        )}

        {/* Bouton Ajouter au panier (optionnel et style configurable) */}
        {cardSettings?.addToCartButtonStyle && cardSettings?.addToCartButtonStyle !== 'none' && (
           <button
            onClick={handleAddToCartClick}
            className="w-full mt-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors duration-150 flex items-center justify-center"
            style={{
                backgroundColor: cardSettings?.addToCartBackgroundColor || generalSettings?.primaryColor,
                color: cardSettings?.addToCartTextColor || '#FFFFFF',
                borderColor: cardSettings?.addToCartBorderColor || cardSettings?.addToCartBackgroundColor || generalSettings?.primaryColor,
            }}
            aria-label={`${t('product.addToCartFor', 'Ajouter au panier')} ${product.name}`}
           >
            {cardSettings?.addToCartButtonStyle === 'icon' || cardSettings?.addToCartButtonStyle === 'icon-text' ? (
                <ShoppingBag size={16} className={cardSettings?.addToCartButtonStyle === 'icon-text' ? 'mr-1.5' : ''} />
            ) : null}
            {cardSettings?.addToCartButtonStyle === 'text' || cardSettings?.addToCartButtonStyle === 'icon-text' ? (
                t('product.addToCartShort', 'Ajouter')
            ) : null}
           </button>
        )}
      </div>
    </a>
  );
};
