// themes/mono/components/Product/FeaturedProductDisplay.tsx
import React from 'react';
import { ProductInterface } from '../../Interfaces/Interfaces';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';
import { getMedia } from '../Utils/media'; // Ajout de getFileType
import { Star, MessageSquare, Package, AlertCircle } from 'lucide-react'; // Ajout d'icônes pour stock, commentaires
import { useTranslation } from 'react-i18next';
import ProductPriceDisplay from './ProductPriceDisplay'; // Nouveau composant pour gérer l'affichage du prix
import { getFileType } from '../Utils/functions';
import { Link } from '../../renderer/Link';
import { usePageContext } from '../../renderer/usePageContext';
import { AddToFavoriteButton } from './AddToFavoriteButton';



interface FeaturedProductDisplayProps {
  product: ProductInterface;
  layoutConfig: {
    imagePosition: 'left' | 'right' | 'overlay';
    textOverlay?: boolean;
  };
  index: number;
}

// Composant pour afficher les étoiles de notation
export const RatingStars: React.FC<{ rating: number; count?: number; showCount?: boolean }> = ({ rating, count, showCount = true }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  const { t } = useTranslation();

  return (
    <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size="1em" className="text-yellow-400 fill-yellow-400" />
      ))}
      {halfStar && <Star key="half" size="1em" className="text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />} {/* Demi-étoile */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size="1em" className="text-slate-300 dark:text-slate-600 fill-slate-300 dark:fill-slate-600" />
      ))}
      {showCount && count !== undefined && (
        <span className="ml-1.5">({count} {t('product.reviews', { count })})</span>
      )}
    </div>
  );
};


const FeaturedProductDisplay: React.FC<FeaturedProductDisplayProps> = ({ product, layoutConfig }) => {
  const { t } = useTranslation();
  const  { serverUrl,storeApiUrl,storeInfoInitial } = usePageContext()
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);
  const productCardSettings = useThemeSettingsStore(state => state.productCard || DEFAULT_SETTINGS?.productCard);
  
  const getProductMedia = (p: ProductInterface): { url?: string; type?: 'image' | 'video' } => {
    const defaultFeature = p.features?.find(f => f.id === p.default_feature_id);
    const mediaSource = defaultFeature?.values?.[0]?.views?.[0] || p.features?.[0]?.values?.[0]?.views?.[0];

    if (mediaSource) {
      return {
        url: getMedia({ source: mediaSource as string, from: 'api', host: storeApiUrl }),
        type: getFileType(mediaSource as string) // Utilise ton helper pour déterminer le type
      };
    }
    return { url: '/assets/product-placeholder.png', type: 'image' }; // Fallback
  };

  const media = getProductMedia(product);
  const isOverlayLayout = layoutConfig.textOverlay;
  const imageOnLeft = layoutConfig.imagePosition === 'left';

  // Stock: On prend le stock de la première valeur de la feature par défaut, ou le stock global du produit si défini.
  // Pour un affichage simple, on ne gère pas la somme des stocks de toutes les variantes ici.
  const stockInfo = product.features?.find(f => f.id === product.default_feature_id)?.values?.[0]?.stock ?? product.stock;
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


  const renderMedia = () => {
    if (media.type === 'video' && media.url) {
      return (
        <video
          src={media.url}
          className="w-full h-full object-cover aspect-video"
          autoPlay
          loop
          muted // Important pour l'autoplay dans de nombreux navigateurs
          playsInline // Important pour iOS
          //@ts-ignore
          poster={product.features?.[0]?.values?.[0]?.icon?.[0] || '/assets/product-placeholder.png'} // Optionnel: une image de poster
        >
          {t('product.videoNotSupported', 'Votre navigateur ne supporte pas la lecture de vidéos.')}
        </video>
      );
    }
    // Par défaut ou si type image
    return (
      <img
        src={media.url}
        alt={product.name}
        className="w-full h-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  };

  const renderContent = () => (
    <div className={`flex flex-col justify-center ${isOverlayLayout ? 'p-6 md:p-8 text-white relative z-10 h-full' : 'p-6 md:p-8 lg:p-10'}`}>
      <h3 
        className={`text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 ${isOverlayLayout ? '' : `text-[${generalSettings?.textColor}] dark:text-[${generalSettings?.darkMode?.textColor}]`}`}
        style={{ 
          fontFamily: generalSettings?.headingFont, 
          color: isOverlayLayout ? 'inherit' : (generalSettings?.darkMode?.enabled ? generalSettings?.darkMode.textColor : generalSettings?.textColor)
        }}
      >
        {product.name}
      </h3>

      {/* Note et Nombre de Commentaires */}
      {(productCardSettings?.showRating || product.comment_count > 0) && (
        <div className="flex items-center space-x-2 mb-2 sm:mb-3">
          {product.rating > 0 && <RatingStars rating={product.rating} count={product.comment_count} showCount={false} />}
          {product.comment_count > 0 && (
            <Link href={`/${product.slug}#reviews`} className={`flex items-center text-xs sm:text-sm ${isOverlayLayout ? 'opacity-80 hover:opacity-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
              <MessageSquare size="1em" className="mr-1" />
              <span>{product.comment_count} {t('product.reviews', { count: product.comment_count })}</span>
            </Link>
          )}
        </div>
      )}

      <p 
        className={`text-sm md:text-base mb-3 sm:mb-4 line-clamp-3 ${isOverlayLayout ? 'opacity-90' : `text-[${generalSettings?.textColor}] dark:text-[${generalSettings?.darkMode?.textColor}] opacity-80`}`}
        style={{color: isOverlayLayout ? 'inherit' : (generalSettings?.darkMode?.enabled ? generalSettings?.darkMode.textColor : generalSettings?.textColor), opacity: isOverlayLayout ? 0.9 : 0.8}}
      >
        {product.description}
      </p>

      {/* Affichage du Prix */}
      <ProductPriceDisplay 
        price={product.price} 
        barredPrice={product.barred_price} 
        currency={product.currency || 'XOF'}
        priceColor={isOverlayLayout ? '#FFFFFF' : (productCardSettings?.priceColor || generalSettings?.primaryColor)}
        barredPriceColor={isOverlayLayout ? 'rgba(255,255,255,0.7)' : 'text-slate-400 dark:text-slate-500'}
        className="text-xl lg:text-2xl font-semibold mb-3 sm:mb-4"
        reductionDisplay={productCardSettings?.reductionDisplay}
      />
      
      {/* Stock Info */}
      {showStock && (
        <div className={`flex items-center text-xs sm:text-sm mb-3 sm:mb-4 font-medium ${stockLevelColor}`}>
          {stockInfo !== null && stockInfo > 0 ? <Package size="1em" className="mr-1.5" /> : <AlertCircle size="1em" className="mr-1.5" />}
          <span>{stockLevelText}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-auto"> {/* mt-auto pour pousser les boutons en bas si en overlay */}
        <Link
          href={`/${product.slug}`}
          className="px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium rounded-md shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ 
            backgroundColor: isOverlayLayout ? (generalSettings?.primaryColor || '#FFFFFF') : (productCardSettings?.addToCartBackgroundColor || generalSettings?.primaryColor),
            color: isOverlayLayout ? (generalSettings?.darkMode?.enabled ? generalSettings?.darkMode.textColor : generalSettings?.textColor) : (productCardSettings?.addToCartTextColor || '#FFFFFF'),
            borderColor: productCardSettings?.addToCartBorderColor || 'transparent',
          }}
        >
          {t('product.viewDetails', 'Voir les détails')}
        </Link>
      </div>
      <AddToFavoriteButton product={product}/>
    </div>
  );

  if (isOverlayLayout) {
    return (
      <div className="relative rounded-lg overflow-hidden shadow-xl group w-full" style={{paddingBottom: "56.25%" /* 16:9 aspect ratio */ }}>
        <div className="absolute inset-0">
          {renderMedia()}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/10"></div> {/* Ajuster le dégradé */}
        <div className="absolute inset-0 flex flex-col justify-end md:justify-center text-center md:text-left">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div 
        className={`grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch rounded-lg shadow-xl overflow-hidden`}
        style={{backgroundColor: generalSettings?.darkMode?.enabled ? generalSettings?.darkMode.backgroundColor : generalSettings?.backgroundColor}}
    >
      <div className={`md:col-span-1 ${imageOnLeft ? 'md:order-1' : 'md:order-2'}`}>
        <a href={`/${product.slug}`} className="block aspect-[4/3] sm:aspect-square md:aspect-auto md:h-full group overflow-hidden">
          {renderMedia()}
        </a>
      </div>
      <div className={`md:col-span-1 ${imageOnLeft ? 'md:order-2' : 'md:order-1'} flex`}> {/* Ajouté flex pour que renderContent prenne toute la hauteur */}
        {renderContent()}
      </div>
    </div>
  );
};

export default FeaturedProductDisplay;

/*

ok gerer une card special pour le main product, une card qui prend toute la page qui present 4 images dont un plus grande, qui montre les 
*/