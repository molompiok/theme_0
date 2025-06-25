// themes/mono/components/Cart/CartItemDisplay.tsx
import React from 'react';
import { CartStoreItem } from '../../api/stores/CartStore'; // Ou CommandItemInterface si type direct du serveur
import { getMedia } from '../Utils/media';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpdateCart } from '../../api/ReactSublymusApi'; // Hook pour MAJ/suppression
import { CommandItemInterface, ProductInterface, ValueInterface } from '../../Interfaces/Interfaces';
import { useThemeSettingsStore } from '../../api/themeSettingsStore';
import { usePageContext } from '../../renderer/usePageContext';

interface CartItemDisplayProps {
  item: CartStoreItem | (CommandItemInterface & { product?: ProductInterface }); // Accepte les deux types
  onUpdateQuantity: (productId: string, bind: Record<string, string>, newQuantity: number) => void;
  onRemoveItem: (productId: string, bind: Record<string, string>) => void;
  isUpdating: boolean; // Pour désactiver les boutons pendant une MAJ
}

const CartItemDisplay: React.FC<CartItemDisplayProps> = ({ item, onUpdateQuantity, onRemoveItem, isUpdating }) => {
  const { t } = useTranslation();
  const { storeApiUrl }  = usePageContext()
  const generalSettings = useThemeSettingsStore(state => state.general);
  
  // Adapter pour extraire les infos depuis CartStoreItem ou CommandItemInterface
  const productId = item.product_id;
  const productName = (item as CartStoreItem).product_name || (item as CommandItemInterface & { product?: ProductInterface }).product?.name || t('cart.unknownProduct', 'Produit inconnu');
  const productImage = (item as CartStoreItem).product_image || (item as CommandItemInterface & { product?: ProductInterface }).product?.features?.[0]?.values?.[0]?.views?.[0] as string || '/assets/product-placeholder.png';
  const quantity = item.quantity;
  const priceUnit = item.price_unit;
  const bind = (item as CartStoreItem).bind || (item as CommandItemInterface).bind || {};
  const bindName = (item as CartStoreItem).bind_name || (item as CommandItemInterface).bind_name || {};
  const currency = (item as CommandItemInterface).currency || 'XOF'; // Supposer XOF par défaut

  const imageUrl = getMedia({ source: productImage, from: 'api', host: storeApiUrl });

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 0) { // Permettre 0 pour suppression potentielle via mise à jour
      onUpdateQuantity(productId, bind, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemoveItem(productId, bind);
  };
  
  // Afficher les options sélectionnées
  const renderBindOptions = () => {
    if (!bindName || Object.keys(bindName).length === 0) return null;
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {Object.entries(bindName).map(([featureNameKey, valueDetails]) => {
          const featureDisplayName = featureNameKey.split(':')[0] || featureNameKey; // Enlever le type de la clé
          return (
            <div key={featureNameKey}>
              <span className="font-medium">{featureDisplayName}:</span> {(valueDetails as ValueInterface).text || valueDetails.text as string}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-start py-4 border-b border-slate-200 dark:border-slate-700">
      <img src={imageUrl} alt={productName} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md mr-4" />
      <div className="flex-grow">
        <h4 className="text-sm sm:text-md font-semibold text-slate-800 dark:text-slate-100 mb-0.5">{productName}</h4>
        {renderBindOptions()}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('cart.itemPrice', 'Prix unitaire : {{price, currency}}', { price: priceUnit, currency })}
        </p>
        <div className="flex items-center mt-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={isUpdating || quantity <= 1} // Désactiver si qté = 1 pour décrémenter (suppression via poubelle)
            className="p-1 border border-slate-300 dark:border-slate-600 rounded-full disabled:opacity-50"
            aria-label={t('cart.decreaseQuantity', 'Diminuer la quantité')}
          >
            <Minus size={14} />
          </button>
          <span className="mx-3 text-sm font-medium w-6 text-center">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={isUpdating} // TODO: Ajouter vérification stock max si pertinent
            className="p-1 border border-slate-300 dark:border-slate-600 rounded-full disabled:opacity-50"
            aria-label={t('cart.increaseQuantity', 'Augmenter la quantité')}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end ml-4">
        <p className="text-sm sm:text-md font-semibold" style={{ color: generalSettings?.primaryColor }}>
          {(priceUnit * quantity).toLocaleString(undefined, { style: 'currency', currency })}
        </p>
        <button
          onClick={handleRemove}
          disabled={isUpdating}
          className="mt-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50"
          aria-label={t('cart.removeItem', 'Supprimer l\'article')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CartItemDisplay;