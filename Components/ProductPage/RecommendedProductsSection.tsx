// themes/mono/components/ProductPage/RecommendedProductsSection.tsx
import React from 'react';
import { ProductInterface } from '../../Interfaces/Interfaces';
import {ProductCard} from '../Product/ProductCard'; // Le ProductCard simple
import { useTranslation } from 'react-i18next';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';


interface RecommendedProductsSectionProps {
  currentProduct: ProductInterface;
  allInitialProducts: ProductInterface[]; // Les 10 produits initiaux du store
}

const RecommendedProductsSection: React.FC<RecommendedProductsSectionProps> = ({ currentProduct, allInitialProducts }) => {
  const { t } = useTranslation();
  const homePageSettings = useThemeSettingsStore(state => state.homePage || DEFAULT_SETTINGS?.homePage);
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);

  const recommendedProducts = allInitialProducts
    .filter(p => p.id !== currentProduct.id) // Exclure le produit actuel
    .slice(0, 9); // Limiter à 9 recommandations (ou settings?.productPage.relatedProductsCount)

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 sm:mt-16 lg:mt-20 py-8 border-t dark:border-slate-700">
      <h2 
        className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left"
        style={{
            color: generalSettings?.textColor,
            fontFamily: generalSettings?.headingFont 
          }}
      >
        {t(homePageSettings?.recommendedProductsSectionTitleKey || 'product.youMightAlsoLike', 'Vous pourriez aussi aimer')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {recommendedProducts.map(product => (
          <ProductCard  key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedProductsSection;
