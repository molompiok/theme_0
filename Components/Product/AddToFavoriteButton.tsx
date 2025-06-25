// themes/mono/components/Product/AddToFavoriteButton.tsx
import React from 'react';
import { Heart as HeartIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../api/stores/AuthStore';
import { useFavoritesStore } from '../../api/stores/FavoritesStore';
import { useModalAuthStore } from '../../api/stores/ModalAuthStore';
import {
  useGetFavorites as useGetServerFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from '../../api/ReactSublymusApi'; // Ajuste le chemin
import { ProductInterface } from '../../Interfaces/Interfaces'; // Ajuste le chemin
import { useTranslation } from 'react-i18next';
import { useThemeSettingsStore, DEFAULT_SETTINGS } from '../../api/themeSettingsStore';
import { cn } from '../Utils/cn';


interface AddToFavoriteButtonProps {
  product: ProductInterface;
  className?: string;
  iconSize?: number;
  // Tu pourrais ajouter des callbacks pour des actions après ajout/suppression si besoin
  // onAdded?: (productId: string) => void;
  // onRemoved?: (productId: string) => void;
}

export const AddToFavoriteButton: React.FC<AddToFavoriteButtonProps> = ({
  product,
  className,
  iconSize = 20,
}) => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { openModal: openAuthModal } = useModalAuthStore();

  // Favoris locaux
  const localFavoriteIds = useFavoritesStore((state) => state.favoriteProductIds);
  const addLocalFavorite = useFavoritesStore((state) => state.addLocalFavorite);
  const removeLocalFavorite = useFavoritesStore((state) => state.removeLocalFavorite);

  // Favoris serveur
  const { data: serverFavoritesResponse, refetch: refetchServerFavorites } = useGetServerFavorites(
    {}, // Pas de filtres spécifiques nécessaires ici, juste la liste complète
    { enabled: !!token } // Activé seulement si connecté
  );

  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  
  const generalSettings = useThemeSettingsStore(state => state.general || DEFAULT_SETTINGS?.general);


  const isFavorite = React.useMemo(() => {
    if (token && serverFavoritesResponse) {
      return serverFavoritesResponse.list.some(fav => fav.product_id === product.id);
    }
    return localFavoriteIds.includes(product.id);
  }, [token, serverFavoritesResponse, localFavoriteIds, product.id]);

  const isLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche la navigation si le bouton est dans un lien
    e.stopPropagation(); // Empêche le clic de se propager aux éléments parents

    if (!token) {
      // Si non connecté, proposer de se connecter avant d'ajouter aux favoris "serveur"
      // Ou ajouter localement et proposer la synchro plus tard.
      // Pour un MVP, on peut ajouter localement directement.
      if (isFavorite) {
        removeLocalFavorite(product.id);
      } else {
        addLocalFavorite(product.id);
      }
      // Optionnel: ouvrir le modal de connexion si on veut qu'ils se connectent pour "vraiment" sauvegarder
      // openAuthModal('login'); 
      // alert(t('favorites.loginToSavePrompt', 'Connectez-vous pour sauvegarder vos favoris !'));
      return;
    }

    // Utilisateur connecté
    if (isFavorite) {
      const favoriteEntry = serverFavoritesResponse?.list.find(fav => fav.product_id === product.id);
      if (favoriteEntry) {
        removeFavoriteMutation.mutate({ favorite_id: favoriteEntry.id }, {
          onSuccess: () => refetchServerFavorites(),
          // onError: ... (gérer l'erreur, peut-être restaurer l'état UI)
        });
      }
    } else {
      addFavoriteMutation.mutate({ product_id: product.id }, {
        onSuccess: () => refetchServerFavorites(),
        // onError: ...
      });
    }
  };

  // Style pour le bouton
  // Tu peux le rendre configurable via les settings du thème si besoin (ex: productCard.favoriteIconPosition)
    const buttonClasses = cn(
    "p-2 bg-white dark:bg-slate-700/80 rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    isFavorite 
      ? `focus:ring-[${generalSettings?.primaryColor}] dark:focus:ring-[${generalSettings?.darkMode?.primaryColor}]`
      : `focus:ring-slate-400 dark:focus:ring-slate-500`,
    isLoading ? 'opacity-70 cursor-wait' : 'hover:scale-110',
    className // Permet de surcharger les classes
  );
  
  const iconColor = isFavorite ? (generalSettings?.darkMode?.enabled ? (generalSettings?.darkMode.primaryColor || '#F87171') : (generalSettings?.primaryColor || '#EF4444')) : "text-slate-400 dark:text-slate-500";
  const iconFill = isFavorite ? iconColor : "none";


  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={buttonClasses}
      aria-label={isFavorite ? t('favorites.removeFromFavorites', 'Retirer des favoris') : t('favorites.addToFavorites', 'Ajouter aux favoris')}
      title={isFavorite ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
      style={{
        // Appliquer les couleurs du thème
        // Le focus ring est géré par les classes, mais on pourrait aussi le mettre en style
      }}
    >
      {isLoading ? (
        <Loader2 size={iconSize} className="animate-spin text-slate-500" />
      ) : (
        <HeartIcon
          size={iconSize}
          className={`transition-colors ${iconColor}`}
          fill={iconFill}
        />
      )}
    </button>
  );
};