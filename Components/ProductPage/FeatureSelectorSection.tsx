// themes/mono/components/ProductPage/FeatureSelectorSection.tsx
import React, { useState, useEffect } from 'react';
import { ProductInterface, FeatureInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';
import { getMedia } from '../Utils/media'; // Si les valeurs ont des icônes/images
import { FeatureType } from '../Utils/functions';
import { usePageContext } from '../../renderer/usePageContext';

interface FeatureSelectorSectionProps {
  product: ProductInterface;
  selectedBind: Record<string, string>; // Le bind actuel { featureId: valueId }
  onBindChange: (newBind: Record<string, string>) => void; // Callback pour mettre à jour le bind
}

// Ce composant est un placeholder et nécessitera une logique plus complexe
// pour gérer la sélection, la mise à jour du prix/stock en fonction des options, etc.
// Pour l'instant, il liste juste les features et leurs valeurs.

const FeatureSelectorSection: React.FC<FeatureSelectorSectionProps> = ({ product,onBindChange,selectedBind }) => {
  const {storeApiUrl} = usePageContext()
    const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);

  if (!product.features || product.features.length === 0 || (product.features.length === 1 && product.features[0].is_default)) {
    return null; // Ne rien afficher si pas de features sélectionnables ou seulement la feature par défaut
  }

  return (
    <section className="my-8 py-6 border-y dark:border-slate-700">
      {product.features.filter(f => !f.is_default).map(feature => ( // Exclure la feature par défaut si elle ne sert qu'aux images/prix de base
        <div key={feature.id} className="mb-4">
          <h4 className="text-md font-semibold mb-2" style={{color: generalSettings?.textColor, fontFamily: generalSettings?.headingFont}}>
            {feature.name}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {feature.values?.map(value => {
              // Logique de rendu basée sur feature.type
              if (feature.type === FeatureType.COLOR) {
                return (
                  <button 
                    key={value.id} 
                    title={value.text || ''}
                    className="w-8 h-8 rounded-full border-2 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ 
                      backgroundColor: value.key || '#ccc', // La couleur est dans value.key
                      borderColor: selectedBind[feature.id] === value.id ? generalSettings?.primaryColor : 'transparent'
                    }}
                    onClick={() => onBindChange({ ...selectedBind, [feature.id]: value.id })}
                  />
                );
              } else if (feature.type === FeatureType.ICON_TEXT || feature.type === FeatureType.TEXT || feature.type === FeatureType.ICON) {
                return (
                  <button
                    key={value.id}
                    className={`px-3 py-1.5 border rounded-md text-sm transition-colors
                               hover:border-slate-500 focus:outline-none focus:ring-1
                               ${ selectedBind[feature.id] === value.id 
                                  ? `bg-[${generalSettings?.primaryColor}] text-white border-[${generalSettings?.primaryColor}]` 
                                  : `bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-[${generalSettings?.textColor}] dark:text-[${generalSettings?.darkMode?.textColor}]`
                                }`}
                    style={{ 
                        borderColor: selectedBind[feature.id] === value.id ? generalSettings?.primaryColor : undefined,
                        backgroundColor: selectedBind[feature.id] === value.id ? generalSettings?.primaryColor : undefined,
                        color: selectedBind[feature.id] === value.id ? (generalSettings?.darkMode?.enabled ? generalSettings?.darkMode.backgroundColor : '#FFFFFF') : undefined,
                    }}
                    onClick={() => onBindChange({ ...selectedBind, [feature.id]: value.id })}
                  >
                    {feature.type.includes('icon') && value.icon?.[0] && <img src={getMedia({source: value.icon[0] as string, from:'api', host: storeApiUrl})} alt={value.text || ''} className="w-4 h-4 mr-1.5 inline-block"/>}
                    {feature.type.includes('text') && value.text}
                  </button>
                );
              }
              // Ajouter d'autres types de features si nécessaire pour le thème Mono
              return null;
            })}
          </div>
        </div>
      ))}
    </section>
  );
};

export default FeatureSelectorSection;