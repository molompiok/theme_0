// themes/mono/pages/index/+Page.tsx

import React, { useEffect, useMemo } from 'react';
import { usePageContext } from '../../renderer/usePageContext';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';
import { useGetProductList } from '../../api/ReactSublymusApi'; // Hook pour lister les produits
import logger from '../../api/Logger'; // Si tu l'utilises
import { ProductInterface } from '../../Interfaces/Interfaces'; // Type Produit

// Importer le nouveau composant pour l'affichage "featured"
import FeaturedProductDisplay from '../../Components/Product/FeaturedProductDisplay';
// Importer le composant ProductCard si tu veux une section "plus de produits" en bas
// import ProductCard from '../../components/Product/ProductCard';

import { useTranslation } from 'react-i18next'; // Pour les titres de section

// Supprimer les imports spécifiques à la prévisualisation si ce n'est plus la page de preview
// import { SublymusApi, ApiError } from '../../api/SublymusApi';
// import logoPlaceholder from './logo-placeholder.svg'; // Plus besoin
// import productPlaceholder from './product-placeholder.png'; // Plus besoin directement ici

export function Page() {
  const { t } = useTranslation();
  const { storeApiUrl, serverUrl } = usePageContext(); // Récupérer les URLs
  
  const homePageSettings = useThemeSettingsStore(state => state.homePage || DEFAULT_SETTINGS.homePage);
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS.general);

  const displayCount = homePageSettings?.displayProductCount || 10;
  const categoryIdFilter = homePageSettings?.defaultCategoryIdForProducts || undefined;

  // Récupérer les produits pour la page d'accueil
  const { data: productsResponse, isLoading, error } = useGetProductList(
    {
      limit: displayCount,
      categories_id: categoryIdFilter ? [categoryIdFilter] : undefined,
      order_by: 'date_desc', // Ou un autre tri par défaut pertinent
      with_feature: true, // Pour avoir les images des variantes par défaut
    },
    { enabled: !!storeApiUrl } // Activer seulement si storeApiUrl est défini
  );

  const productsToDisplay: ProductInterface[] = productsResponse?.list || [];

  // Ce code était pour la page de preview de theme0, on le supprime ou l'adapte pour Mono
  /*
    // const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
    // const [realCategories, setRealCategories] = useState<CategoryInterface[]>([]);
    // const [realProducts, setRealProducts] = useState<ProductInterface[]>([]);
    // const api = useMemo(...);
    // const fetchStoreData = useCallback(...);
    // useEffect pour postMessage ...
    // useEffect pour fetchStoreData ...
    // Styles dynamiques ...
    // return (
    //   <div className="theme-preview-page font-sans antialiased" style={bodyStyle}>
    // ... affichage du thème de preview ...
    //   </div>
    // );
  */

  if (isLoading) {
    return <div className="container mx-auto px-4 py-10 text-center">{t('loadingProducts', 'Chargement des produits...')}</div>;
  }

  if (error) {
    logger.error("Failed to fetch products for homepage", error);
    return <div className="container mx-auto px-4 py-10 text-center text-red-600">{t('error.loadProducts', 'Erreur lors du chargement des produits.')}</div>;
  }

  if (!productsToDisplay.length) {
    return <div className="container mx-auto px-4 py-10 text-center">{t('home.noProducts', 'Aucun produit à afficher pour le moment.')}</div>;
  }

  return (
    <div className="theme-mono-homepage">
      {/* Optionnel: Bannière Héro */}
      {/* <HeroBanner settings={...} /> */}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {homePageSettings?.showFeaturedTitleKey && (
          <h2 
            className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center"
            style={{ 
              color: generalSettings?.textColor,
              fontFamily: generalSettings?.headingFont 
            }}
          >
            {t(homePageSettings.showFeaturedTitleKey)}
          </h2>
        )}

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {productsToDisplay.map((product, index) => (
            <FeaturedProductDisplay
              key={product.id}
              product={product}
              layoutConfig={{
                // Déterminer la config de layout pour CE produit
                // Si productDisplayLayouts a une config pour cet index, l'utiliser
                // Sinon, utiliser fallbackLayout ou la logique d'alternance
                imagePosition: homePageSettings?.productDisplayLayouts?.[index]?.imagePosition || 
                               (homePageSettings?.alternateLayouts && index % 2 !== 0 
                                 ? (homePageSettings?.fallbackLayout?.imagePosition === 'left' ? 'right' : 'left') 
                                 : homePageSettings?.fallbackLayout?.imagePosition) || 'left',
                textOverlay: homePageSettings?.productDisplayLayouts?.[index]?.textOverlay || homePageSettings?.fallbackLayout?.textOverlay || false,
              }}
              index={index} // Pour l'alternance
            />
          ))}
        </div>

        {/* Section "Plus de produits" si tu veux afficher les mêmes 10 produits en mode card en bas */}
        {/* Cela semble redondant comme tu l'as mentionné, donc je le laisse commenté pour l'instant */}
        {/* {productsToDisplay.length > 0 && (
          <section className="mt-12 pt-8 border-t">
            <h3 className="text-xl font-semibold mb-4">Découvrez aussi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productsToDisplay.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )} */}

      </div>
    </div>
  );
}