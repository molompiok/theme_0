// themes/mono/components/Cart/ModalCart.tsx
import React, { useEffect, useMemo } from 'react';
import { useCartStore, CartStoreItem } from '../../api/stores/CartStore';
import { useAuthStore } from '../../api/stores/AuthStore';
import { useModalAuthStore } from '../../api/stores/ModalAuthStore';
import ModalAuth from '../auth/ModalAuth'; // Ton composant ModalAuth
import { useViewCart, useUpdateCart, useMergeCart } from '../../api/ReactSublymusApi';
import { Button } from '../UI/Button';
import { X, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CartItemDisplay from './CartItemDisplay';
import { CommandItemInterface, ProductInterface } from '../../Interfaces/Interfaces';
import { navigate } from 'vike/client/router';
import { useThemeSettingsStore } from '../../api/themeSettingsStore';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { useChildViewer } from '../ChildViewer/useChildViewer';

const ModalCart: React.FC = () => {
  const { t } = useTranslation();
  const { isCartModalOpen, closeCartModal, items: localItems, setCartFromServer, clearCart: clearLocalCart } = useCartStore();
  const {  token, user } = useAuthStore();
  const { openModal: openAuthView } = useModalAuthStore();
  const { openChild } = useChildViewer();
  const generalSettings = useThemeSettingsStore(state => state.general);

  // Fetch server cart si connecté
  const { 
    data: serverCartResponse, 
    isLoading: isLoadingServerCart, 
    refetch: refetchServerCart,
    error: serverCartError 
  } = useViewCart({ enabled: !!token && isCartModalOpen }); // Fetch seulement si modal ouvert et user connecté

  const updateCartMutation = useUpdateCart();
  const mergeCartMutation = useMergeCart();

  // Effet pour fusionner les paniers lors de la connexion si le modal est ouvert
  // Ou si le modal s'ouvre et que l'utilisateur est maintenant connecté.
  useEffect(() => {
    const handleMerge = async () => {
      if (token && localItems.length > 0) {
        // On ne fusionne que si le panier local (invité) a des items.
        // Le backend `merge_cart_on_login` devrait gérer l'ajout des items session au panier user.
        // Ici, on s'assure que l'appel est fait.
        try {
          console.log("[ModalCart] Attempting to merge cart on login...");
          await mergeCartMutation.mutate(); // Le backend fusionne la session cart au user cart
          clearLocalCart(); // Vider le panier local après la fusion réussie par le serveur
          refetchServerCart(); // Recharger le panier du serveur
          console.log("[ModalCart] Cart merge successful, local cart cleared.");
        } catch (error) {
          console.error("[ModalCart] Failed to merge cart:", error);
          // Gérer l'erreur (ex: afficher un toast)
          // Peut-être ne pas vider le panier local pour que l'utilisateur ne perde rien.
        }
      } else if (token) {
        // Si connecté et pas de panier local à fusionner, juste s'assurer que le panier serveur est à jour
        refetchServerCart();
      }
    };

    if (token && isCartModalOpen) { // Conditionner la fusion
      handleMerge();
    }
  }, [token, isCartModalOpen, localItems.length, mergeCartMutation, refetchServerCart, clearLocalCart]);


  // Choisir quels items afficher : serveur si connecté et chargé, sinon local
  const displayItems = useMemo(() => {
    if (token && serverCartResponse?.cart?.items) {
      // Mapper les items du serveur au format CartStoreItem ou utiliser CommandItemInterface directement dans CartItemDisplay
      return serverCartResponse.cart.items.map((item: CommandItemInterface & { product?: ProductInterface }) => ({
        id: item.id, // L'ID de l'item de la commande
        product_id: item.product_id,
        product_name: item.product?.name || 'Produit',
        product_slug: item.product?.slug,
        product_image: item.product?.features?.[0]?.values?.[0]?.views?.[0] as string || item.product?.features?.[0]?.icon?.[0] as string,
        quantity: item.quantity,
        price_unit: item.price_unit,
        bind: item.bind,
        bind_name: item.bind_name,
        currency: item.currency,
      }));
    }
    return localItems;
  }, [token, serverCartResponse, localItems]);

  const totalAmount = useMemo(() => {
    if (token && serverCartResponse?.total !== undefined) {
      return serverCartResponse.total;
    }
    //@ts-ignore
    return displayItems.reduce((sum, item) => sum + item.price_unit * item.quantity, 0);
  }, [token, serverCartResponse, displayItems]);

  const handleUpdateQuantity = (productId: string, bind: Record<string, string>, newQuantity: number) => {
    const mode = newQuantity === 0 ? 'clear' : 'set'; // 'clear' pour suppression, 'set' pour MAJ qté
    updateCartMutation.mutate(
      { product_id: productId, mode, value: newQuantity, bind },
      {
        onSuccess: (data) => {
          if (token) {
            refetchServerCart(); // Si connecté, rafraîchir le panier serveur
          } else {
            // Mettre à jour le store local Zustand avec la réponse de l'API
            // Le backend retourne le panier complet après MAJ
            const updatedStoreItems: CartStoreItem[] = (data.cart.items || []).map((item: any) => ({
              id: item.id || `${item.product_id}-${JSON.stringify(item.bind)}`,
              product_id: item.product_id,
              product_name: item.product?.name || 'Produit',
              product_slug: item.product?.slug,
              product_image: item.product?.features?.[0]?.values?.[0]?.views?.[0] as string || item.product?.features?.[0]?.icon?.[0] as string,
              quantity: item.quantity,
              price_unit: item.price_unit,
              bind: item.bind,
              bind_name: item.bind_name,
            }));
            useCartStore.getState().setCartFromServer(data.cart.items, {}); // productDetails non dispo ici
          }
        },
        // onError: ...
      }
    );
  };

  const handleRemoveItem = (productId: string, bind: Record<string, string>) => {
    handleUpdateQuantity(productId, bind, 0); // Mettre la quantité à 0 équivaut à supprimer
  };
  
  const handleProceedToCheckout = () => {
    if (!token) {
      closeCartModal(); // Fermer le modal panier
      openChild(
        <ChildViewer>
          <ModalAuth currentView={'login'} />
        </ChildViewer>, 
        { background: generalSettings?.darkMode?.enabled ? 'rgba(10,20,30,0.6)' : 'rgba(255,255,255,0.6)', blur:3 }
      );
      // Sauvegarder l'intention de checkout pour y rediriger après login
      localStorage.setItem('auth_redirect', '/checkout');
    } else {
      closeCartModal();
      navigate('/checkout'); // Rediriger vers la page de checkout
    }
  };

  if (!isCartModalOpen) {
    return null;
  }
  
  const isLoading = isLoadingServerCart || updateCartMutation.isPending || mergeCartMutation.isPending;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={closeCartModal} // Fermer si on clique sur le fond
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture si on clique dans le modal
      >
        {/* Header du Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center">
            <ShoppingBag size={20} className="mr-2 text-primary" />
            {t('cart.title', 'Votre Panier')}
          </h3>
          <button 
            onClick={closeCartModal} 
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            aria-label={t('common.close', 'Fermer')}
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenu du Panier */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading && !displayItems.length && ( // Afficher loader seulement si pas d'items à montrer
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {serverCartError && !isLoading && (
            <div className="text-center py-10 text-red-500">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              {t('cart.errorLoading', 'Erreur de chargement du panier.')}
            </div>
          )}
          {!isLoading && !serverCartError && displayItems.length === 0 && (
            <div className="text-center py-10">
              <ShoppingBag size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">{t('cart.empty', 'Votre panier est vide.')}</p>
            </div>
          )}
          {displayItems.map((item:any) => (
            <CartItemDisplay
              key={item.id || `${item.product_id}-${JSON.stringify(item.bind)}`} // Clé plus robuste
              item={item as any} // Caster car le type peut être CartStoreItem ou CommandItemInterface
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              isUpdating={updateCartMutation.isPending}
            />
          ))}
        </div>

        {/* Footer du Modal (Total et Bouton Checkout) */}
        {displayItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-md font-medium text-slate-600 dark:text-slate-300">{t('cart.total', 'Total :')}</span>
              <span className="text-xl font-bold" style={{ color: generalSettings?.primaryColor }}>
                {totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'XOF' /* TODO: Dynamiser la devise */ })}
              </span>
            </div>
            <Button
              onClick={handleProceedToCheckout}
              className="w-full"
              isLoading={isLoading} // Peut-être un autre loader pour le checkout
              disabled={isLoading}
              style={{ backgroundColor: generalSettings?.primaryColor }}
            >
              {t('cart.proceedToCheckout', 'Passer à la caisse')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalCart;