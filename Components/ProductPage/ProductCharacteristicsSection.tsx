

// themes/mono/components/ProductPage/ProductCharacteristicsSection.tsx
import React from 'react';
import { useListProductCharacteristics } from '../../api/ReactSublymusApi';
import { useTranslation } from 'react-i18next';
import { getMedia } from '../Utils/media';
import { usePageContext } from '../../renderer/usePageContext';


const ProductCharacteristicsSection: React.FC<{ productId: string }> = ({ productId }) => {
  const { t } = useTranslation();
  const { data: characteristicsResponse, isLoading } = useListProductCharacteristics({ product_id: productId });
  const { storeApiUrl } = usePageContext();

  if (isLoading) return <p>{t('loading', 'Chargement...')}</p>;
  if (!characteristicsResponse || characteristicsResponse.list.length === 0) return null;

  return (
    <section id="characteristics" className="py-6 border-t dark:border-slate-700">
      <h2 className="text-xl font-semibold mb-4">{t('product.characteristics', 'Caractéristiques')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {characteristicsResponse.list.map(char => (
          <div key={char.id} className="flex py-2 border-b border-slate-200 dark:border-slate-700/50">
            {char.icon && <img src={getMedia({source: char.icon?.[0], from: 'api', host: storeApiUrl})} alt={char.name} className="w-5 h-5 mr-2 opacity-70"/>}
            <span className="font-medium text-slate-700 dark:text-slate-300 min-w-[120px] sm:min-w-[150px]">{char.name}:</span>
            <span className="text-slate-600 dark:text-slate-400">{char.value_text || `${char.quantity || ''} ${char.unity || ''}`}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
export default ProductCharacteristicsSection;
