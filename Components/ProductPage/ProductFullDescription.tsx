// themes/mono/components/ProductPage/ProductFullDescription.tsx
import React from 'react';
import { useGetDetailList } from '../../api/ReactSublymusApi'; // Hook à créer pour les "Details"
import { DetailInterface } from '../../Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { getMedia } from '../Utils/media';
import { usePageContext } from '../../renderer/usePageContext';
import { MarkdownViewer } from '../MarkdownViewer/MarkdownViewer';

const ProductFullDescription: React.FC<{ productId: string }> = ({ productId }) => {
  const { t } = useTranslation();
  const { data: detailsResponse, isLoading } = useGetDetailList({ product_id: productId }); // S'assurer que ce hook existe et fonctionne
  const { storeApiUrl } = usePageContext();

  if (isLoading) return <p>{t('loading', 'Chargement...')}</p>;
  if (!detailsResponse || detailsResponse.list.length === 0) return null; // Ne rien afficher si pas de détails

  return (
    <section id="description" className="prose prose-slate dark:prose-invert max-w-none">
      {/* Optionnel: titre de section */}
      {/* <h2 className="text-xl font-semibold mb-4">{t('product.fullDescription', 'Description Détaillée')}</h2> */}
      {detailsResponse.list.map(detail => (
        <div key={detail.id} className="mb-6 product-detail-item">
          {detail.title && <h3 className="text-lg font-medium mb-2">{detail.title}</h3>}
          {detail.view?.[0] && (
            <div className="my-4">
              <img src={getMedia({source: detail.view[0] as string, from:'api', host: storeApiUrl})} alt={detail.title || 'Detail image'} className="rounded-md shadow-sm max-w-full h-auto" />
            </div>
          )}
          {detail.description && <MarkdownViewer  markdown={detail.description} />}
        </div>
      ))}
    </section>
  );
};
export default ProductFullDescription;
