// api/stores/CartStore.ts
import { create } from 'zustand';
import { combine, persist, createJSONStorage } from 'zustand/middleware';
import { ProductInterface, ValueInterface, CommandItemInterface } from '../Interfaces/Interfaces'; // Ajuste le chemin
import { SublymusApi } from '../SublymusApi'; // Pour les appels API

// Interface pour un item dans le store Zustand du panier
// Peut être un peu différent de CommandItemInterface si on stocke plus/moins d'infos localement
export interface CartStoreItem {
  id: string; // ID unique pour l'item dans le panier (peut être product_id + hash(bind))
  product_id: string;
  product_name: string;
  product_slug?: string;
  product_image?: string | null; // URL de l'image principale de la variante
  quantity: number;
  price_unit: number; // Prix de la variante (produit + options)
  bind: Record<string, string>; // { feature_id: value_id }
  bind_name?: Record<string, ValueInterface>; // Pour afficher les options
  // Peut-être des infos sur le stock si tu veux le gérer côté client pour l'UX
}

interface CartState {
  items: CartStoreItem[];
  isCartModalOpen: boolean;
  isLoading: boolean; // Pour les opérations de panier
  error: string | null;
}

const initialCartState: CartState = {
  items: [],
  isCartModalOpen: false,
  isLoading: false,
  error: null,
};

// Pour synchroniser avec le localStorage (surtout pour les invités)
const CART_STORAGE_KEY = 'sublymus-mono-cart';

export const useCartStore = create(
  persist( // Utilise persist pour sauvegarder/restaurer depuis localStorage
    combine(initialCartState, (set, get) => ({
      // Actions pour le modal
      openCartModal: () => set({ isCartModalOpen: true }),
      closeCartModal: () => set({ isCartModalOpen: false }),
      toggleCartModal: () => set(state => ({ isCartModalOpen: !state.isCartModalOpen })),

      // Actions pour les items (logique de base, sera souvent liée aux appels API)
      addItem: (newItem: CartStoreItem) => {
        set(state => {
          const existingItemIndex = state.items.findIndex(item => item.id === newItem.id);
          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }
          return { items: [...state.items, newItem] };
        });
      },
      updateItemQuantity: (itemId: string, newQuantity: number) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
          ).filter(item => item.quantity > 0) // Supprimer si quantité 0
        }));
      },
      removeItem: (itemId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },
      clearCart: () => {
        set({ items: [] /*, autres champs à reset si besoin */ });
      },
      
      // Action pour charger le panier depuis le serveur (après login par exemple)
      // ou pour remplacer le panier local par celui du serveur.
      setCartFromServer: (serverCartItems: CommandItemInterface[], productDetails: Record<string, ProductInterface>) => {
        const newStoreItems: CartStoreItem[] = serverCartItems.map(serverItem => {
          const product = productDetails[serverItem.product_id];
          // Construire l'ID unique pour CartStoreItem (ex: product_id + hash des options)
          // ou utiliser l'ID de CommandItemInterface si stable.
          // Pour l'instant, on prend l'ID de CommandItemInterface.
          return {
            id: serverItem.id, // ou un ID généré localement
            product_id: serverItem.product_id,
            product_name: product?.name || serverItem.product?.name || 'Produit inconnu',
            product_slug: product?.slug || serverItem.product?.slug,
            product_image: product?.features?.[0]?.values?.[0]?.views?.[0] as string || serverItem.product?.features?.[0]?.values?.[0]?.views?.[0] as string || null,
            quantity: serverItem.quantity,
            price_unit: serverItem.price_unit,
            bind: serverItem.bind || {},
            bind_name: serverItem.bind_name || {},
          };
        });
        set({ items: newStoreItems, isLoading: false, error: null });
      },

      // Actions asynchrones (exemples, tu les affineras avec tes hooks React Query)
      // Ces actions pourraient appeler les mutations de React Query
      // ou être remplacées par des appels directs aux mutations dans les composants.
      // Pour un MVP, il est souvent plus simple de gérer la logique d'appel API dans les composants
      // avec les hooks React Query et de n'utiliser Zustand que pour l'état UI (modal) et le panier invité.

      // Exemple (à ne PAS utiliser si tu as déjà des hooks React Query pour ça):
      /*
      syncWithServer: async (api: SublymusApi) => {
        if (!useAuthStore.getState().isAuthenticated) return; // Ne synchronise que si connecté
        set({ isLoading: true, error: null });
        try {
          const serverCart = await api.cart.view();
          // Logique pour mapper serverCart.cart.items à CartStoreItem[]
          // set({ items: mappedItems, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: (err as Error).message });
        }
      },
      */
    })),
    {
      name: CART_STORAGE_KEY, // Clé pour localStorage
      storage: createJSONStorage(() => localStorage), // Utiliser localStorage
      // Ne persister que certains champs (surtout pour le panier invité)
      partialize: (state) => ({
        items: state.items,
        // Ne pas persister isCartModalOpen, isLoading, error
      }),
      // S'exécute après la réhydratation (au chargement de l'app)
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate cart from localStorage", error);
        } else if (state) {
          console.log("Cart rehydrated from localStorage", state.items);
          // Tu pourrais vouloir vérifier ici si l'utilisateur est connecté.
          // Si oui, et que le panier localStorage (invité) a des items,
          // tu pourrais déclencher une fusion ou préférer le panier serveur.
          // Pour l'instant, on charge juste ce qui est dans localStorage.
        }
      }
    }
  )
);