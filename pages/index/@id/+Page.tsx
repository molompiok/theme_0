// themes/mono/pages/products/@id.page.tsx

import { useTranslation } from 'react-i18next';
import { usePageContext } from '../../../renderer/usePageContext';
import ProductGalleryAndInfo from '../../../Components/ProductPage/ProductGalleryAndInfo';
import FeatureSelectorSection from '../../../Components/ProductPage/FeatureSelectorSection';
import ProductFullDescription from '../../../Components/ProductPage/ProductFullDescription';
import ProductCharacteristicsSection from '../../../Components/ProductPage/ProductCharacteristicsSection';
import ProductFaqsSection from '../../../Components/ProductPage/ProductFaqsSection';
import ProductReviewsSection from '../../../Components/ProductPage/ProductReviewsSection';
import RecommendedProductsSection from '../../../Components/ProductPage/RecommendedProductsSection';
import { useGetProduct, useGetProductList } from '../../../api/ReactSublymusApi';
import { useState } from 'react';

// Importer les nouveaux composants de section
// Vike nécessite que le composant Page soit exporté par défaut ou nommé "Page"
export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { id:slug } = pageContext.routeParams || {}; // Récupérer le slug depuis les paramètres de route Vike

  console.log('-------------->>',{slug});
  
  // Récupérer le produit principal
  const { data: productResponse, isLoading: isLoadingProduct, error: productError } = useGetProduct(
    { slug_product: slug as string, with_feature: true }, // S'assurer que with_feature est true
    { enabled: !!slug && !!pageContext.storeApiUrl } // Activer seulement si slug et storeApiUrl sont présents
  );
  const product = productResponse; // C'est directement l'objet ProductInterface | null


 

  // Récupérer les 10 produits "initiaux" du store pour les recommandations
  // (on filtre le produit actuel de cette liste dans RecommendedProductsSection)
  const { data: allProductsStoreResponse, isLoading: isLoadingAllProducts } = useGetProductList(
    { limit: 10, order_by: 'date_desc', with_feature: true }, // Ajuste le tri si besoin
    { enabled: !!pageContext.storeApiUrl }
  );
  const allInitialProducts = allProductsStoreResponse?.list || [];


  if (isLoadingProduct || isLoadingAllProducts) {
    return <div className="container mx-auto px-4 py-20 text-center">{t('loadingProductDetails', 'Chargement des détails du produit...')}</div>;
  }

  if (productError || !product) {
    console.log("Failed to fetch product details", { slug, error: productError });
    // Rediriger vers une page 404 ou afficher un message
    // import { navigate } from 'vike/client/router';
    // useEffect(() => { navigate('/404'); }, []); // Exemple de redirection
    return <div className="container mx-auto px-4 py-20 text-center text-red-600">{t('product.notFoundOnPage', 'Produit non trouvé.')}</div>;
  }
  
  // Définir le titre de la page dynamiquement (Vike)
  // pageContext.title = product.name; // Fait par +title.js ou +data.js

  return (
    <div className="theme-mono-product-page container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Section principale avec galerie et infos + actions */}
      <ProductGalleryAndInfo product={product} />

       {/* Caractéristiques */}
        <ProductCharacteristicsSection productId={product.id} />

      
      {/* Sections d'informations détaillées (peuvent être dans des onglets ou en sections successives) */}
      <div className="mt-10 sm:mt-12 lg:mt-16 space-y-10">
        {/* Description détaillée (vient des "Details" du produit) */}
        <ProductFullDescription productId={product.id} />

        {/* FAQs du Produit */}
        <ProductFaqsSection productId={product.id} />

        {/* Avis et Commentaires */}
        <ProductReviewsSection productId={product.id} />
      </div>

      {/* Produits Recommandés */}
      <RecommendedProductsSection
        currentProduct={product}
        allInitialProducts={allInitialProducts}
      />
    </div>
  );
}
