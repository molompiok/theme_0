import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProductInterface } from '../../Interfaces/Interfaces'; // Ajuste le chemin

// On stocke seulement les IDs des produits favoris localement
interface LocalFavoriteState {
  favoriteProductIds: string[];
  // Actions pour gérer les favoris locaux
  addLocalFavorite: (productId: string) => void;
  removeLocalFavorite: (productId: string) => void;
  isLocalFavorite: (productId: string) => boolean;
  setLocalFavorites: (productIds: string[]) => void; // Pour remplacer après fetch serveur
  clearLocalFavorites: () => void; // Utile au logout ou après synchronisation
}

const FAVORITES_STORAGE_KEY = 'sublymus-mono-favorites';

export const useFavoritesStore = create<LocalFavoriteState>()(
  persist(
    (set, get) => ({
      favoriteProductIds: [],
      addLocalFavorite: (productId) =>
        set((state) => ({
          favoriteProductIds: state.favoriteProductIds.includes(productId)
            ? state.favoriteProductIds
            : [...state.favoriteProductIds, productId],
        })),
      removeLocalFavorite: (productId) =>
        set((state) => ({
          favoriteProductIds: state.favoriteProductIds.filter((id) => id !== productId),
        })),
      isLocalFavorite: (productId) => get().favoriteProductIds.includes(productId),
      setLocalFavorites: (productIds) => set({ favoriteProductIds: productIds }),
      clearLocalFavorites: () => set({ favoriteProductIds: [] }),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);