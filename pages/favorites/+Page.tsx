// themes/mono/pages/favorites/+Page.tsx
import React, { useEffect, useState } from 'react';
import { Layout as ThemeLayout } from '../../renderer/Layout';
import { usePageContext } from '../../renderer/usePageContext';
import { useAuthStore } from '../../api/stores/AuthStore';
import { useFavoritesStore } from '../../api/stores/FavoritesStore';
import {
    useGetFavorites as useGetServerFavorites, // Renommé pour clarté
    useAddFavorite,
    useRemoveFavorite,
    useGetProductList, // Pour fetcher les détails des produits favoris locaux
} from '../../api/ReactSublymusApi';
import { ProductCard } from '../../Components/Product/ProductCard'; // Ton composant ProductCard
import { ProductInterface } from '../../Interfaces/Interfaces';
import { Heart, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../Components/UI/Button'; // Ton composant Button
import { navigate } from 'vike/client/router';
import { useModalAuthStore } from '../../api/stores/ModalAuthStore';
import ModalAuth from '../../Components/auth/ModalAuth';
import { useChildViewer } from '../../Components/ChildViewer/useChildViewer';
import { promises } from 'dns';

export function Page() {
    const { t } = useTranslation();
    const { user, token } = useAuthStore();
    const pageContext = usePageContext();

    // Favoris locaux (pour invités ou avant synchro)
    const { favoriteProductIds: localFavoriteIds, removeLocalFavorite, addLocalFavorite } = useFavoritesStore();

    console.log({ localFavoriteIds });

    // État pour stocker les produits favoris à afficher (combinés ou locaux)
    const [displayProducts, setDisplayProducts] = useState<ProductInterface[]>([]);

    const { openChild } = useChildViewer()

    // Fetch des favoris du serveur si l'utilisateur est connecté
    const {
        data: serverFavoritesResponse,
        isLoading: isLoadingServerFavorites,
        error: serverFavoritesError,
        refetch: refetchServerFavorites,
    } = useGetServerFavorites({}, { enabled: !!token }); // Activé seulement si token existe

    // Hook pour fetcher les détails des produits basés sur les IDs des favoris locaux
    // On ne l'active que si l'utilisateur n'est pas connecté et qu'il y a des favoris locaux
    const {
        data: localFavoriteProductsResponse,
        isLoading: isLoadingLocalProducts,
        error: localProductsError,
    } = useGetProductList(
        { list_product_ids: localFavoriteIds || [], limit: localFavoriteIds.length || 1, with_feature: true }, // Envoie les IDs
        { enabled: localFavoriteIds.length > 0 }
    );

    const addFavoriteMutation = useAddFavorite();
    const removeFavoriteMutation = useRemoveFavorite();

    // Effet pour synchroniser et déterminer quels produits afficher
    useEffect(() => {
        const serverProducts = serverFavoritesResponse?.list.map(fav => fav.product).filter(Boolean) as ProductInterface[] ||[];
        if (serverProducts.length > 0)
            setDisplayProducts(serverProducts);
    }, [
        token,
        serverFavoritesResponse,
    ]);

   useEffect(() => {
  const serverProducts = serverFavoritesResponse?.list.map(fav => fav.product).filter(Boolean) as ProductInterface[] || [];
  const serverIds = serverProducts.map(p => p.id);

  const localProducts = localFavoriteProductsResponse?.list as ProductInterface[] || [];
  const localIds = localProducts.map(p => p.id);

  // Merge: ajouter uniquement les produits locaux NON PRÉSENTS dans le serveur
  const mergedProducts = [...serverProducts, ...localProducts.filter(p => !serverIds.includes(p.id))];

  setDisplayProducts(mergedProducts);

  // Synchronisation : ajouter sur le serveur les favoris locaux manquants
  if (token && localIds.length > 0) {
    const idsToAdd = localIds.filter(id => !serverIds.includes(id));

    idsToAdd.forEach((id) => {
      addFavoriteMutation.mutate({ product_id: id });
    });
  }
}, [token, serverFavoritesResponse, localFavoriteProductsResponse]);
    
    // TODO: Logique de fusion au login
    // Dans un useEffect qui réagit à `isAuthenticated` ou dans le callback de login
    // Si on passe de non-connecté à connecté et qu'il y a des localFavoriteIds,
    // les ajouter via addFavoriteMutation.mutateAsync, puis refetchServerFavorites.

    const handleToggleFavorite = async (product: ProductInterface) => {
        const isCurrentlyFavorite = token
            ? displayProducts.some(p => p.id === product.id)
            : localFavoriteIds.includes(product.id);

        if (token) {
            // Logique serveur
            if (isCurrentlyFavorite) {
                // Trouver l'ID du favori sur le serveur pour le supprimer
                const favoriteEntry = serverFavoritesResponse?.list.find(fav => fav.product_id === product.id);
                if (favoriteEntry) {
                    removeFavoriteMutation.mutate({ favorite_id: favoriteEntry.id }, {
                        onSuccess: () => refetchServerFavorites(),
                        // onError: ...
                    });
                }
            } else {
                addFavoriteMutation.mutate({ product_id: product.id }, {
                    onSuccess: () => refetchServerFavorites(),
                    // onError: ...
                });
            }
        } else {
            // Logique locale
            if (isCurrentlyFavorite) {
                removeLocalFavorite(product.id);
            } else {
                addLocalFavorite(product.id);
            }
        }
    };


    const renderContent = () => {
        if (isLoadingServerFavorites || isLoadingLocalProducts) {
            return (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            );
        }
        if (serverFavoritesError || localProductsError) {
            // Gérer l'état d'erreur serveur aussi
            if (serverFavoritesError) {
                return (
                    <div className="text-center py-12">
                        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                        <h2 className="text-xl font-semibold text-red-600 mb-2">{t('error.title', 'Une erreur est survenue')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('favorites.errorServer', 'Impossible de charger vos favoris pour le moment.')}</p>
                    </div>
                );
            }
            return (
                <div className="text-center py-12">
                    <Heart size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('favorites.emptyUserTitle', 'Votre liste de favoris est vide')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{t('favorites.emptyUserMessage', 'Ajoutez des produits à vos favoris pour les retrouver facilement ici.')}</p>
                    <Button onClick={() => navigate('/')} variant="primary">
                        {t('favorites.browseProducts', 'Découvrir les produits')}
                    </Button>
                </div>
            );
        }


        if (displayProducts.length == 0) {
            return (
                <div className="text-center py-12">
                    <Heart size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('favorites.emptyGuestTitle', 'Vos favoris sont vides')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{t('favorites.emptyGuestMessage', 'Parcourez nos produits et ajoutez ceux qui vous plaisent !')}</p>
                    <Button onClick={() => navigate('/')} variant="primary">
                        {t('favorites.browseProducts', 'Découvrir les produits')}
                    </Button>
                </div>
            );
        }


        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {displayProducts.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                    // Tu pourrais passer une prop isFavorite et onToggleFavorite à ProductCard
                    // pour qu'il gère son propre bouton coeur.
                    // Pour l'instant, on le laisse gérer en externe.
                    />
                ))}
            </div>
        );
    };

    const redirectToLogin = () => {
        // Sauvegarder la page actuelle pour y revenir après login
        localStorage.setItem('auth_redirect', '/favorites');
        openChild(<ModalAuth currentView={'login'} />);
    }


    console.log({ serverFavoritesResponse });

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 sm:mb-8 flex items-center">
                <Heart size={28} className="mr-3 text-red-500" />
                {t('profile.nav.favorites', 'Mes Favoris')}
            </h1>

            {!token && localFavoriteIds.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                    <p className="mb-2">{t('favorites.guestMessage', 'Vous consultez vos favoris en tant qu\'invité.')}</p>
                    <Button onClick={redirectToLogin} size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-700/50">
                        {t('favorites.loginToSave', 'Connectez-vous pour les sauvegarder')}
                    </Button>
                </div>
            )}
            {renderContent()}
        </div>
    );
}

// Optionnel: export const Layout = ThemeLayout; si tu veux que ThemeLayout soit le layout par défaut pour ce dossier.






























