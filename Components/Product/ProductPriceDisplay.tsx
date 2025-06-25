// themes/mono/components/Product/ProductPriceDisplay.tsx
import React from 'react';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';

interface ProductPriceDisplayProps {
  price?: number | null;
  barredPrice?: number | null;
  currency: string;
  priceColor?: string;
  barredPriceColor?: string;
  className?: string;
  reductionDisplay?: "barred-price" | "percent-reduction" | "none";
}

const ProductPriceDisplay: React.FC<ProductPriceDisplayProps> = ({
  price,
  barredPrice,
  currency,
  priceColor,
  barredPriceColor = 'text-slate-400 dark:text-slate-500', // Couleur par défaut pour le prix barré
  className = '',
  reductionDisplay = 'barred-price',
}) => {
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS.general);

  const finalPriceColor = priceColor || generalSettings?.primaryColor;

  if (price === null || price === undefined) {
    return null; // Ou un placeholder "Prix non disponible"
  }

  const displayBarredPrice = barredPrice && barredPrice > price && reductionDisplay !== 'none';
  let reductionPercentage: number | null = null;

  if (displayBarredPrice && barredPrice && price && reductionDisplay === 'percent-reduction') {
    reductionPercentage = Math.round(((barredPrice - price) / barredPrice) * 100);
  }

  return (
    <div className={`flex items-baseline flex-wrap ${className}`}>
      <span className="font-bold" style={{ color: finalPriceColor }}>
        {price.toLocaleString(undefined, { style: 'currency', currency: currency })}
      </span>
      {displayBarredPrice && reductionDisplay === 'barred-price' && (
        <span className={`ml-2 line-through ${barredPriceColor}`}>
          {barredPrice!.toLocaleString(undefined, { style: 'currency', currency: currency })}
        </span>
      )}
      {reductionPercentage !== null && (
        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 text-xs font-semibold rounded">
          -{reductionPercentage}%
        </span>
      )}
    </div>
  );
};

export default ProductPriceDisplay;