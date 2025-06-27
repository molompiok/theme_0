//api/ReactSublymusApi.tsx

import React, { createContext, useContext, useMemo, ReactNode } from 'react';

import {
    QueryClient, QueryClientProvider, useQuery, useMutation,
    UseQueryResult, UseMutationResult, InvalidateQueryFilters, QueryKey
} from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
    SublymusApi, ApiError,
    // Importer TOUS les types Params/Response nécessaires depuis SublymusApi.ts
    LoginParams, LoginResponse, RegisterParams, RegisterResponse,
    VerifyEmailParams, ResendVerificationParams, UpdateUserParams, UpdateUserResponse,
    GetMeResponse, MessageResponse, DeleteResponse,
    GetProductListParams, GetProductListResponse, GetProductParams, GetProductResponse,
    GetCategoriesParams, GetCategoriesResponse, GetCategoryResponse,
    
    GetSubCategoriesParams, GetSubCategoriesResponse, GetCategoryFiltersParams, GetCategoryFiltersResponse,
    GetFeaturesParams, GetFeaturesResponse, GetFeatureParams, GetFeatureResponse, GetFeaturesWithValuesParams, GetFeaturesWithValuesResponse,
    GetValuesParams, 
    GetDetailListParams, GetDetailListResponse, GetDetailParams, GetDetailResponse,
    CreateOrderParams, CreateOrderResponse, GetMyOrdersParams, GetMyOrdersResponse,
    GetAllOrdersResponse, GetOrderParams, GetOrderResponse, UpdateOrderStatusParams, UpdateOrderStatusResponse,
   UpdateCartParams, UpdateCartResponse, ViewCartResponse, MergeCartResponse,
    CreateCommentParams, CreateCommentResponse, GetCommentForOrderItemParams, GetCommentForOrderItemResponse,
    GetCommentsParams, GetCommentsResponse, UpdateCommentParams, UpdateCommentResponse, DeleteCommentParams, DeleteCommentResponse,
    AddFavoriteParams, AddFavoriteResponse, GetFavoritesParams, GetFavoritesResponse, UpdateFavoriteParams, UpdateFavoriteResponse, DeleteFavoriteParams, DeleteFavoriteResponse,
    CreateAddressParams, AddressResponse, GetAddressesParams, GetAddressesResponse, UpdateAddressParams, DeleteAddressParams,
    CreatePhoneParams, PhoneResponse, GetPhonesParams, GetPhonesResponse, UpdatePhoneParams, DeletePhoneParams,
    UserFilterType,
    GetInventoriesParams, GetInventoriesResponse, GetInventoryResponse,  InventoryResponse, Inventory, // Utiliser Inventory
    FilesObjectType,
    GetCategoryParams
} from './SublymusApi'; // Importer la classe et l'erreur, et TOUS les types
import { useAuthStore } from './stores/AuthStore'; // Pour le token
import logger from './Logger';
import { CommandFilterType, CommentInterface, FeatureInterface, ForgotPasswordParams, ResetPasswordParams, SetupAccountParams, SetupAccountResponse} from './Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import {
    ListProductFaqsParams, ListProductFaqsResponse,
    GetProductFaqParams, GetProductFaqResponse,
    ProductFaqInterface, 
    ListProductCharacteristicsParams, ListProductCharacteristicsResponse,
    GetProductCharacteristicParams, GetProductCharacteristicResponse,
    ProductCharacteristicInterface 
} from  './Interfaces/Interfaces'

async function waitHere(millis: number) {
    await new Promise((rev) => setTimeout(() => rev(0), millis))
}

// --- Client TanStack Query (inchangé) ---
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Ne pas réessayer pour les erreurs 4xx (sauf 429 - Too Many Requests)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
                    return false;
                }
                // Réessayer 3 fois pour les autres erreurs
                return failureCount < 3;
            }
        },
    },
});

// --- Contexte API (inchangé) ---
interface SublymusApiContextType {
    api: SublymusApi | null;
}
const SublymusApiContext = createContext<SublymusApiContextType>({ api: null });

// Provider pour l'API et TanStack Query
interface SublymusApiProviderProps {
    children: ReactNode;
    handleUnauthorized?: (action?: string, token?: string) => void
    mainServerUrl?: string,
    storeApiUrl?: string,
    getAuthToken: () => string | undefined | null
}

export const SublymusApiProvider: React.FC<SublymusApiProviderProps> = ({ handleUnauthorized, children, storeApiUrl, getAuthToken, mainServerUrl }) => {
    const { t } = useTranslation();
    const api = useMemo(() => {

        // Server URL est toujours requis

        // if (!storeApiUrl) {
        //     logger.error("SublymusApiProvider: storeApiUrl prop is missing!");
        //     return null;
        // }

        // Créer l'instance avec les deux URLs
      
        return new SublymusApi({
            handleUnauthorized(action, token) {
                console.log(action, token);

            },
            getAuthToken,
            serverUrl: mainServerUrl,
            storeApiUrl: storeApiUrl,
            t
        });
    }, [storeApiUrl, mainServerUrl]);

    return (
        <QueryClientProvider client={queryClient}>
            <SublymusApiContext.Provider value={{ api }}>
                {children}
            </SublymusApiContext.Provider>
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
};

const waitFor = (async (fn: Promise<any>, time = 2000): Promise<any> => {
    await waitHere(time)
    const res = await fn;
    return res
})


// --- Hook useApi (inchangé) ---
export const useApi = (): SublymusApi => {
    const context = useContext(SublymusApiContext);

    const { t } = useTranslation();
    if (!context || !context.api) {
        throw new Error(t('api.contextError.providerMissing'));
    }
    return context.api;
};

// ========================
// == Authentification API ==
// ========================

// Clés de Query communes pour Auth
const AUTH_QUERY_KEYS = {
    me: ['me'] as const,
};

const getAuthBackend = (api: SublymusApi, target?: 'api' | 'server') => {
    return api[target == 'api' ? 'authApi' : 'authServer']
}


// Hook pour demander la réinitialisation du mot de passe
export const useRequestPasswordReset = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ForgotPasswordParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ForgotPasswordParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).forgotPassword(params), // Assumer que la méthode existe dans api.authApi
        // Pas de onSuccess/onError générique ici, géré dans le composant
    });
};

export const useResetPassword = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ResetPasswordParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ResetPasswordParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).resetPassword(params), // Assumer que la méthode existe dans api.authApi
        // Pas de onSuccess/onError générique ici, géré dans le composant
    });
};


export const useLogin = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<LoginResponse, ApiError, LoginParams> => {
    const api = useApi();
    return useMutation<LoginResponse, ApiError, LoginParams>({
        mutationFn: (credentials) => getAuthBackend(api, options?.backend_target).login(credentials),
        onSuccess: (data) => {
            queryClient.setQueryData(AUTH_QUERY_KEYS.me, { user: data.user });
            logger.info("Login successful via mutation", { userId: data.user.id });
            useAuthStore.setState({ user: data.user });
        },
        onError: (error) => { logger.error({ error }, "Login failed via mutation"); }
    });
};

export const useRegister = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<RegisterResponse, ApiError, RegisterParams> => {
    const api = useApi();
    return useMutation<RegisterResponse, ApiError, RegisterParams>({
        mutationFn: (data) => getAuthBackend(api, options?.backend_target).register(data),
        onSuccess: (data) => { logger.info("Registration successful via mutation", { userId: data.user_id }); },
        onError: (error) => { logger.error({ error }, "Registration failed via mutation"); }
    });
};

export const useVerifyEmail = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, VerifyEmailParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, VerifyEmailParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).verifyEmail(params),
        onSuccess: (data) => {
            logger.info("Email verified via mutation", data);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me });
        },
        onError: (error) => { logger.error({ error }, "Email verification failed via mutation"); }
    });
};

export const useResendVerificationEmail = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, ResendVerificationParams> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, ResendVerificationParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).resendVerificationEmail(params),
        onSuccess: (data) => { logger.info("Resend verification email requested via mutation", data); },
        onError: (error) => { logger.error({ error }, "Resend verification email failed via mutation"); }
    });
};

export const useLogout = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).logout(),
        onSuccess: (data) => {
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
            queryClient.clear(); // Vider tout le cache
            logger.info("Logout successful via mutation", data);
            useAuthStore.setState({ user: undefined });
        },
        onError: (error) => {
            // Même en cas d'erreur (ex: token déjà invalide), on nettoie côté client
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
            queryClient.clear();
            useAuthStore.setState({ user: undefined });
            logger.error({ error }, "Logout failed via mutation, client state cleared anyway.");
        }
    });
};

export const useLogoutAllDevices = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    const logoutMutation = useLogout(options); // Utiliser pour le nettoyage client
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).logoutAllDevices(),
        onSuccess: (data) => {
            logger.info("Logout All Devices successful via mutation", data);
            logoutMutation.mutate(); // Déclencher nettoyage client
        },
        onError: (error) => {
            // Nettoyer côté client même si l'API échoue? Probablement oui.
            logoutMutation.mutate();
            logger.error({ error }, "Logout All Devices failed via mutation, client state cleared anyway.");
        }
    });
};

export const useGetMe = (options: { enabled?: boolean, backend_target?: 'api' | 'server' } = {}): UseQueryResult<GetMeResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetMeResponse, ApiError>({
        queryKey: AUTH_QUERY_KEYS.me,
        queryFn: () => getAuthBackend(api, options?.backend_target).getMe(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 15 * 60 * 1000,
    });
};

export const useUpdateUser = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<UpdateUserResponse, ApiError, UpdateUserParams> => {
    const api = useApi();
    return useMutation<UpdateUserResponse, ApiError, UpdateUserParams>({
        mutationFn: (params) => waitFor(getAuthBackend(api, options?.backend_target).update(params), 1000),
        onSuccess: (data) => {
            queryClient.setQueryData<GetMeResponse>(AUTH_QUERY_KEYS.me, (oldData) =>
                oldData ? { user: { ...oldData.user, ...data.user } } : undefined
            );
            logger.info("User profile updated via mutation", data.user);
            // Mettre à jour aussi le store Zustand si utilisé
            useAuthStore.setState(state => ({ user: state.user ? { ...state.user, ...data.user } : undefined }));
        },
        onError: (error) => { logger.error({ error }, "User profile update failed via mutation"); }
    });
};

export const useDeleteAccount = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<MessageResponse, ApiError, void> => {
    const api = useApi();
    const logoutMutation = useLogout(options);
    return useMutation<MessageResponse, ApiError, void>({
        mutationFn: () => getAuthBackend(api, options?.backend_target).deleteAccount(),
        onSuccess: (data) => {
            logger.info("Account deleted via mutation", data);
            logoutMutation.mutate(); // Nettoyer après suppression
        },
        onError: (error) => { logger.error({ error }, "Account deletion failed via mutation"); }
    });
};

// Hook pour finaliser la création de compte collaborateur
export const useSetupAccount = (options?: { backend_target?: 'api' | 'server' }): UseMutationResult<SetupAccountResponse, ApiError, SetupAccountParams> => {
    const api = useApi();
    return useMutation<SetupAccountResponse, ApiError, SetupAccountParams>({
        mutationFn: (params) => getAuthBackend(api, options?.backend_target).setupAccount(params),
        // Pas de onSuccess/onError générique, géré dans la page SetupAccountPage
    });
};

// ========================
// == Produits ==
// ========================

// Clés de Query communes pour Products
const PRODUCTS_QUERY_KEYS = {
    all: ['products'] as const,
    lists: (filters: GetProductListParams = {}) => [...PRODUCTS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetProductParams = {}) => [...PRODUCTS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des produits
export const useGetProductList = (
    filter: GetProductListParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetProductListResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductListResponse, ApiError>({
        queryKey: PRODUCTS_QUERY_KEYS.lists(filter),
        queryFn: () => api.products.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true, // Garder les données précédentes pendant le chargement de nouvelles
    });
};

// Hook pour récupérer UN produit par ID ou Slug
export const useGetProduct = (
    params: GetProductParams, // Doit contenir soit product_id soit slug
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductResponse, ApiError> => {
    const api = useApi();
    const enabled = !!(params.product_id || params.slug_product) && (options.enabled !== undefined ? options.enabled : true);
    return useQuery<GetProductResponse, ApiError>({
        queryKey: PRODUCTS_QUERY_KEYS.details(params),
        queryFn: () => api.products.getOne(params), // Utiliser getOne
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // Cache plus long pour un détail
    });
};

// ========================
// == Catégories ==
// ========================

// Clés de Query communes pour Categories
const CATEGORIES_QUERY_KEYS = {
    all: ['categories'] as const,
    lists: (filters: GetCategoriesParams = {}) => [...CATEGORIES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { category_id?: string; slug?: string } = {}) => [...CATEGORIES_QUERY_KEYS.all, 'detail', params] as const,
    subCategories: (parentId: string) => [...CATEGORIES_QUERY_KEYS.all, 'sub', parentId] as const,
    filters: (slug?: string) => [...CATEGORIES_QUERY_KEYS.all, 'filters', slug ?? 'global'] as const,
};

// Hook pour récupérer la LISTE des catégories
export const useGetCategories = (
    filter: GetCategoriesParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetCategoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCategoriesResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.lists(filter),
        queryFn: () => api.categories.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer UNE catégorie par ID ou Slug
export const useGetCategory = (
    params: GetCategoryParams, // ID ou Slug requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCategoryResponse, ApiError> => {
    const api = useApi();
    const enabled = !!(params.category_id || params.slug) && (options.enabled !== undefined ? options.enabled : true);
    return useQuery<GetCategoryResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.details(params),
        queryFn: () => api.categories.getOne(params),
        enabled: enabled,
        staleTime: 10 * 60 * 1000,
    });
};

// Hook pour créer une catégorie

// Hook pour récupérer les sous-catégories
export const useGetSubCategories = (
    params: GetSubCategoriesParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetSubCategoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetSubCategoriesResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.subCategories(params.category_id),
        queryFn: () => api.categories.getSubCategories(params),
        enabled: !!params.category_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer les filtres
export const useGetCategoryFilters = (
    params: GetCategoryFiltersParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCategoryFiltersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCategoryFiltersResponse, ApiError>({
        queryKey: CATEGORIES_QUERY_KEYS.filters(params.slug),
        queryFn: () => api.categories.getFilters(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// ======================================
// == Features & Values ==
// ======================================

// Clés de Query communes
const FEATURES_QUERY_KEYS = {
    all: ['features'] as const,
    lists: (filters: GetFeaturesParams = {}) => [...FEATURES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetFeatureParams = {}) => [...FEATURES_QUERY_KEYS.all, 'detail', params] as const,
    withValues: (filters: GetFeaturesWithValuesParams = {}) => [...FEATURES_QUERY_KEYS.all, 'withValues', filters] as const,
};
const VALUES_QUERY_KEYS = {
    all: ['values'] as const,
    lists: (filters: GetValuesParams = {}) => [...VALUES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { value_id: string }) => [...VALUES_QUERY_KEYS.all, 'detail', params] as const,
};


// Hook pour récupérer les features (sans valeurs)
export const useGetFeatures = (
    filter: Omit<GetFeaturesParams, 'feature_id'> = {}, // Exclure feature_id pour liste
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeaturesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeaturesResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.lists(filter),
        queryFn: () => api.features.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};
// Hook pour récupérer UNE feature (sans valeurs)
export const useGetFeature = (
    params: { feature_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeatureResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeatureResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.details(params),
        queryFn: () => api.features.getOne(params),
        enabled: !!params.feature_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer les features AVEC valeurs
export const useGetFeaturesWithValues = (
    filter: GetFeaturesWithValuesParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFeaturesWithValuesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFeaturesWithValuesResponse, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.withValues(filter),
        queryFn: () => api.features.getListWithValues(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};
// Hook pour récupérer UNE feature AVEC valeurs
export const useGetFeatureWithValues = (
    params: { feature_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<FeatureInterface | null, ApiError> => {
    const api = useApi();
    return useQuery<FeatureInterface | null, ApiError>({
        queryKey: FEATURES_QUERY_KEYS.withValues(params), // Utiliser la même clé que la liste pour MAJ cache
        queryFn: async () => {
            const result = await api.features.getListWithValues({ ...params, limit: 1 } as any);
            return result?.[0] ?? null;
        },
        enabled: !!params.feature_id && (options.enabled !== undefined ? options.enabled : true),
    });
};


// ================================
// == Détails Produit ==
// ================================

// Clés de Query communes
const DETAILS_QUERY_KEYS = {
    all: ['details'] as const,
    lists: (filters: GetDetailListParams = {}) => [...DETAILS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: GetDetailParams) => [...DETAILS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des détails d'un produit
export const useGetDetailList = (
    filter: GetDetailListParams, // product_id est généralement requis ici
    options: { enabled?: boolean } = {}
): UseQueryResult<GetDetailListResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetDetailListResponse, ApiError>({
        queryKey: DETAILS_QUERY_KEYS.lists(filter),
        queryFn: () => api.details.getList(filter),
        enabled: !!filter.product_id && (options.enabled !== undefined ? options.enabled : true), // Activer si product_id
    });
};

// Hook pour récupérer UN détail par ID
export const useGetDetail = (
    params: GetDetailParams, // detail_id requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetDetailResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetDetailResponse, ApiError>({
        queryKey: DETAILS_QUERY_KEYS.details(params),
        queryFn: () => api.details.getOne(params),
        enabled: !!params.detail_id && (options.enabled !== undefined ? options.enabled : true),
    });
};



// ==================================
// == Hooks pour ProductFaqs       ==
// ==================================

// Clés de Query communes pour ProductFaqs
const PRODUCT_FAQS_QUERY_KEYS = {
    all: (productId: string) => ['productFaqs', productId] as const, // Toutes les FAQs pour un produit
    lists: (params: ListProductFaqsParams) => [...PRODUCT_FAQS_QUERY_KEYS.all(params.product_id), 'list', params] as const,
    details: (faqId: string) => ['productFaqDetails', faqId] as const, // Détail d'une FAQ spécifique
};


/**
 * Hook pour récupérer la liste des FAQs d'un produit.
 */
export const useListProductFaqs = (
    params: ListProductFaqsParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<ListProductFaqsResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListProductFaqsResponse, ApiError>({
        queryKey: PRODUCT_FAQS_QUERY_KEYS.lists(params),
        queryFn: () => api.productFaqs.listForProduct(params),
        enabled: !!params.product_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

/**
 * Hook pour récupérer les détails d'une FAQ spécifique.
 */
export const useGetProductFaq = (
    params: GetProductFaqParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductFaqResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductFaqResponse, ApiError>({
        queryKey: PRODUCT_FAQS_QUERY_KEYS.details(params.faqId),
        queryFn: () => api.productFaqs.getOne(params),
        enabled: !!params.faqId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000, // Cache un peu plus long pour les détails
    });
};



// ==================================
// == Hooks pour ProductCharacteristics ==
// ==================================

// Clés de Query communes pour ProductCharacteristics
const PRODUCT_CHARACTERISTICS_QUERY_KEYS = {
    all: (productId: string) => ['productCharacteristics', productId] as const,
    lists: (params: ListProductCharacteristicsParams) => [...PRODUCT_CHARACTERISTICS_QUERY_KEYS.all(params.product_id), 'list', params] as const,
    details: (characteristicId: string) => ['productCharacteristicDetails', characteristicId] as const,
};


/**
 * Hook pour récupérer la liste des caractéristiques d'un produit.
 */
export const useListProductCharacteristics = (
    params: ListProductCharacteristicsParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<ListProductCharacteristicsResponse, ApiError> => {
    const api = useApi();
    return useQuery<ListProductCharacteristicsResponse, ApiError>({
        queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.lists(params),
        queryFn: () => api.productCharacteristics.listForProduct(params),
        enabled: !!params.product_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

/**
 * Hook pour récupérer les détails d'une caractéristique spécifique.
 */
export const useGetProductCharacteristic = (
    params: GetProductCharacteristicParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetProductCharacteristicResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetProductCharacteristicResponse, ApiError>({
        queryKey: PRODUCT_CHARACTERISTICS_QUERY_KEYS.details(params.characteristicId),
        queryFn: () => api.productCharacteristics.getOne(params),
        enabled: !!params.characteristicId && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000,
    });
};


// ========================
// == Commandes ==
// ========================

// Clés de Query communes pour Orders
const ORDERS_QUERY_KEYS = {
    all: ['orders'] as const,
    myLists: (filters: GetMyOrdersParams = {}) => [...ORDERS_QUERY_KEYS.all, 'myList', filters] as const,
    allLists: (filters: CommandFilterType = {}) => [...ORDERS_QUERY_KEYS.all, 'allList', filters] as const,
    details: (params: GetOrderParams) => [...ORDERS_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour créer une commande
export const useCreateOrder = (): UseMutationResult<CreateOrderResponse, ApiError, CreateOrderParams> => {
    const api = useApi();
    return useMutation<CreateOrderResponse, ApiError, CreateOrderParams>({
        mutationFn: (params) => api.orders.create(params),
        onSuccess: (data) => {
            logger.info("Order created via mutation", data.order);
            // Invalider 'myOrders' et 'allOrders' listes, et le panier
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.myLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.allLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ['cart'] } as InvalidateQueryFilters); // Clé du panier
        },
        onError: (error) => { logger.error({ error }, "Failed to create order via mutation"); }
    });
};

// Hook pour récupérer les commandes de l'utilisateur connecté
export const useGetMyOrders = (
    filter: GetMyOrdersParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetMyOrdersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetMyOrdersResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.myLists(filter),
        queryFn: () => api.orders.getMyList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer TOUTES les commandes (Admin/Collab)
export const useGetAllOrders = (
    filter: CommandFilterType = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetAllOrdersResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetAllOrdersResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.allLists(filter),
        queryFn: () => api.orders.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer les détails d'UNE commande
export const useGetOrderDetails = (
    params: GetOrderParams, // order_id requis
    options: { enabled?: boolean } = {}
): UseQueryResult<GetOrderResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetOrderResponse, ApiError>({
        queryKey: ORDERS_QUERY_KEYS.details(params),
        queryFn: () => api.orders.getOne(params),
        enabled: !!params.order_id && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 5 * 60 * 1000, // Cache un peu plus long pour les détails
    });
};


// Hook pour mettre à jour le statut d'une commande
export const useUpdateOrderStatus = (): UseMutationResult<UpdateOrderStatusResponse, ApiError, UpdateOrderStatusParams> => {
    const api = useApi();
    return useMutation<UpdateOrderStatusResponse, ApiError, UpdateOrderStatusParams>({
        mutationFn: (params) => waitFor(api.orders.updateStatus(params), 3000),
        onSuccess: (data, variables) => {
            logger.info("Order status updated via mutation", data.order);
            const orderId = variables.user_order_id;
            // Invalider les listes ET le détail
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.myLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.allLists() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEYS.details({ order_id: orderId }) } as InvalidateQueryFilters);
            // Mettre à jour directement le cache détail?
            queryClient.setQueryData<GetOrderResponse>(ORDERS_QUERY_KEYS.details({ order_id: orderId }), data.order);
        },
        onError: (error) => { logger.error({ error }, "Failed to update order status via mutation"); }
    });
};

// ====================
// == Namespace Panier ==
// ====================

// Clé de Query pour le Panier
const CART_QUERY_KEY = ['cart'] as const;

// Hook pour voir le panier
export const useViewCart = (options: { enabled?: boolean } = {}): UseQueryResult<ViewCartResponse, ApiError> => {
    const api = useApi();
    return useQuery<ViewCartResponse, ApiError>({
        queryKey: CART_QUERY_KEY,
        queryFn: () => api.cart.view(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 1 * 60 * 1000, // Cache court
    });
};

// Hook pour mettre à jour le panier
export const useUpdateCart = (): UseMutationResult<UpdateCartResponse, ApiError, UpdateCartParams> => {
    const api = useApi();
    return useMutation<UpdateCartResponse, ApiError, UpdateCartParams>({
        mutationFn: (params) => api.cart.update(params),
        onSuccess: (data) => {
            logger.info("Cart updated via mutation", { action: data.action });
            // Mettre à jour le cache avec les données retournées
            queryClient.setQueryData<ViewCartResponse>(CART_QUERY_KEY, { cart: data.cart, total: data.total });
        },
        onError: (error) => { logger.error({ error }, "Failed to update cart via mutation"); }
    });
};

// Hook pour fusionner les paniers au login
export const useMergeCart = (): UseMutationResult<MergeCartResponse, ApiError, void> => {
    const api = useApi();
    return useMutation<MergeCartResponse, ApiError, void>({
        mutationFn: () => api.cart.mergeOnLogin(),
        onSuccess: (data) => {
            logger.info("Carts merged via mutation");
            // Mettre à jour ou invalider le cache panier
            if (data.cart) {
                queryClient.setQueryData<ViewCartResponse>(CART_QUERY_KEY, { cart: data.cart, total: data.total });
            } else {
                queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
            }
        },
        onError: (error) => { logger.error({ error }, "Failed to merge carts via mutation"); }
    });
};

// ===========================
// == Namespace Commentaires ==
// ===========================

// Clés de Query communes
const COMMENTS_QUERY_KEYS = {
    all: ['comments'] as const,
    lists: (filters: GetCommentsParams = {}) => [...COMMENTS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { comment_id: string }) => [...COMMENTS_QUERY_KEYS.all, 'detail', params] as const,
    forItem: (params: GetCommentForOrderItemParams) => [...COMMENTS_QUERY_KEYS.all, 'forItem', params] as const,
};

// Hook pour créer un commentaire
export const useCreateComment = (): UseMutationResult<CreateCommentResponse, ApiError, { data: CreateCommentParams, files?: FilesObjectType }> => {
    const api = useApi();
    return useMutation<CreateCommentResponse, ApiError, { data: CreateCommentParams, files?: FilesObjectType }>({
        mutationFn: (params) => api.comments.create(params),
        onSuccess: (data) => {
            logger.info("Comment created via mutation", data.comment);
            // Invalider la liste des commentaires pour le produit et la query forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: data.comment.product_id }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: data.comment.order_item_id }) } as InvalidateQueryFilters);
            // Invalider aussi les stats produit (rating/count)
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: data.comment.product_id }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Large
        },
        onError: (error) => { logger.error({ error }, "Failed to create comment via mutation"); }
    });
};

// Hook pour récupérer le commentaire d'un order_item
export const useGetCommentForOrderItem = (
    params: GetCommentForOrderItemParams,
    options: { enabled?: boolean } = {}
): UseQueryResult<GetCommentForOrderItemResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCommentForOrderItemResponse, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.forItem(params),
        queryFn: () => api.comments.getForOrderItem(params),
        enabled: !!params.order_item_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

// Hook pour récupérer la LISTE des commentaires
export const useGetComments = (
    filter: GetCommentsParams = {},
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetCommentsResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetCommentsResponse, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.lists(filter),
        queryFn: () => api.comments.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};
// Hook pour récupérer UN commentaire par ID
export const useGetComment = (
    params: { comment_id: string, with_users?: boolean },
    options: { enabled?: boolean } = {}
): UseQueryResult<CommentInterface | null, ApiError> => {
    const api = useApi();
    return useQuery<CommentInterface | null, ApiError>({
        queryKey: COMMENTS_QUERY_KEYS.details(params),
        queryFn: async () => {
            const result = await api.comments.getList(params);
            return result?.list?.[0] ?? null;
        },
        enabled: !!params.comment_id && (options.enabled !== undefined ? options.enabled : true),
    });
};


// Hook pour mettre à jour un commentaire
export const useUpdateComment = (): UseMutationResult<UpdateCommentResponse, ApiError, UpdateCommentParams> => {
    const api = useApi();
    return useMutation<UpdateCommentResponse, ApiError, UpdateCommentParams>({
        mutationFn: (params) => api.comments.update(params),
        onSuccess: (data, variables) => {
            logger.info("Comment updated via mutation", data.comment);
            const commentId = variables.comment_id;
            const orderItemId = data.comment.order_item_id;
            const productId = data.comment.product_id;
            // Invalider listes, détail, forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: commentId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: orderItemId }) } as InvalidateQueryFilters);
            // Invalider stats produit
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update comment via mutation"); }
    });
};

// Hook pour supprimer un commentaire
export const useDeleteComment = (): UseMutationResult<DeleteCommentResponse, ApiError, DeleteCommentParams> => {
    const api = useApi();
    let commentDataForInvalidation: CommentInterface | null = null;
    return useMutation<DeleteCommentResponse, ApiError, DeleteCommentParams>({
        onMutate: async (variables) => {
            commentDataForInvalidation = await queryClient.fetchQuery({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: variables.comment_id }) });
        },
        mutationFn: (params) => api.comments.delete(params),
        onSuccess: (data, variables) => {
            logger.info("Comment deleted via mutation", { commentId: variables.comment_id });
            const commentId = variables.comment_id;
            const productId = commentDataForInvalidation?.product_id;
            const orderItemId = commentDataForInvalidation?.order_item_id;
            // Invalider listes, supprimer détail, forItem
            queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.lists({ product_id: productId }) } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: COMMENTS_QUERY_KEYS.details({ comment_id: commentId }) });
            if (orderItemId) {
                queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEYS.forItem({ order_item_id: orderItemId }) } as InvalidateQueryFilters);
            }
            // Invalider stats produit
            if (productId) {
                queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.details({ product_id: productId }) } as InvalidateQueryFilters);
                queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            }
            commentDataForInvalidation = null;
        },
        onError: (error) => { logger.error({ error }, "Failed to delete comment via mutation"); commentDataForInvalidation = null; }
    });
};

// =======================
// == Namespace Favoris ==
// =======================

// Clés de Query communes
const FAVORITES_QUERY_KEYS = {
    all: ['favorites'] as const,
    lists: (filters: GetFavoritesParams = {}) => [...FAVORITES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { favorite_id: string }) => [...FAVORITES_QUERY_KEYS.all, 'detail', params] as const,
};


// Hook pour ajouter un favori
export const useAddFavorite = (): UseMutationResult<AddFavoriteResponse, ApiError, AddFavoriteParams> => {
    const api = useApi();
    return useMutation<AddFavoriteResponse, ApiError, AddFavoriteParams>({
        mutationFn: (params) => api.favorites.add(params),
        onSuccess: (data) => {
            logger.info("Favorite added via mutation", data);
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to add favorite via mutation"); }
    });
};

// Hook pour récupérer les favoris de l'utilisateur
export const useGetFavorites = (
    filter: GetFavoritesParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<GetFavoritesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetFavoritesResponse, ApiError>({
        queryKey: FAVORITES_QUERY_KEYS.lists(filter),
        queryFn: () => api.favorites.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

// Hook pour mettre à jour un favori (label)
export const useUpdateFavorite = (): UseMutationResult<UpdateFavoriteResponse, ApiError, UpdateFavoriteParams> => {
    const api = useApi();
    return useMutation<UpdateFavoriteResponse, ApiError, UpdateFavoriteParams>({
        mutationFn: (params) => api.favorites.update(params),
        onSuccess: (data, variables) => {
            logger.info("Favorite updated via mutation", data);
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            // Mettre à jour le cache détail si nécessaire
            queryClient.setQueryData<UpdateFavoriteResponse | null>(FAVORITES_QUERY_KEYS.details({ favorite_id: variables.favorite_id }), (old: any) => old ? { ...old, ...data } : undefined);
        },
        onError: (error) => { logger.error({ error }, "Failed to update favorite via mutation"); }
    });
};

// Hook pour supprimer un favori
export const useRemoveFavorite = (): UseMutationResult<DeleteFavoriteResponse, ApiError, DeleteFavoriteParams> => {
    const api = useApi();
    return useMutation<DeleteFavoriteResponse, ApiError, DeleteFavoriteParams>({
        mutationFn: (params) => api.favorites.remove(params),
        onSuccess: (data, variables) => {
            logger.info("Favorite removed via mutation", { favoriteId: variables.favorite_id });
            queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: FAVORITES_QUERY_KEYS.details({ favorite_id: variables.favorite_id }) });
        },
        onError: (error) => { logger.error({ error }, "Failed to remove favorite via mutation"); }
    });
};

// ==============================
// == Namespace UserProfile ==
// ==============================

// Clés de Query communes
const USER_PROFILE_QUERY_KEYS = {
    addresses: (filters: GetAddressesParams = {}) => ['userAddresses', filters] as const,
    phones: (filters: GetPhonesParams = {}) => ['userPhones', filters] as const,
};

// Adresses
export const useCreateUserAddress = (): UseMutationResult<AddressResponse, ApiError, CreateAddressParams> => {
    const api = useApi();
    return useMutation<AddressResponse, ApiError, CreateAddressParams>({
        mutationFn: (params) => api.userProfile.createAddress(params),
        onSuccess: (data) => {
            logger.info("User address created via mutation", data.address);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters); // 'me' contient les adresses
        },
        onError: (error) => { logger.error({ error }, "Failed to create user address via mutation"); }
    });
};

export const useGetUserAddresses = (
    options: { enabled?: boolean } = {}
): UseQueryResult<GetAddressesResponse, ApiError> => {
    const api = useApi();
    // Ce hook récupère la liste complète pour l'utilisateur authentifié
    return useQuery<GetAddressesResponse, ApiError>({
        queryKey: USER_PROFILE_QUERY_KEYS.addresses(),
        queryFn: () => api.userProfile.getAddressList(), // Pas de filtre ici
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useUpdateUserAddress = (): UseMutationResult<AddressResponse, ApiError, UpdateAddressParams> => {
    const api = useApi();
    return useMutation<AddressResponse, ApiError, UpdateAddressParams>({
        mutationFn: (params) => api.userProfile.updateAddress(params),
        onSuccess: (data, variables) => {
            logger.info("User address updated via mutation", data.address);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            // Mettre à jour le cache pour cette adresse spécifique si un hook getOne existe
            // queryClient.setQueryData(USER_PROFILE_QUERY_KEYS.addresses({ id: variables.address_id }), data.address);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update user address via mutation"); }
    });
};

export const useDeleteUserAddress = (): UseMutationResult<DeleteResponse, ApiError, DeleteAddressParams> => {
    const api = useApi();
    return useMutation<DeleteResponse, ApiError, DeleteAddressParams>({
        mutationFn: (params) => api.userProfile.deleteAddress(params),
        onSuccess: (data, variables) => {
            logger.info("User address deleted via mutation", { addressId: variables.address_id });
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.addresses() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to delete user address via mutation"); }
    });
};

// Téléphones (similaire à Adresses)
export const useCreateUserPhone = (): UseMutationResult<PhoneResponse, ApiError, CreatePhoneParams> => {
    const api = useApi();
    return useMutation<PhoneResponse, ApiError, CreatePhoneParams>({
        mutationFn: (params) => api.userProfile.createPhone(params),
        onSuccess: (data) => {
            logger.info("User phone created via mutation", data.phone);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to create user phone via mutation"); }
    });
};

export const useGetUserPhones = (
    options: { enabled?: boolean } = {}
): UseQueryResult<GetPhonesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetPhonesResponse, ApiError>({
        queryKey: USER_PROFILE_QUERY_KEYS.phones(),
        queryFn: () => api.userProfile.getPhoneList(),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useUpdateUserPhone = (): UseMutationResult<PhoneResponse, ApiError, UpdatePhoneParams> => {
    const api = useApi();
    return useMutation<PhoneResponse, ApiError, UpdatePhoneParams>({
        mutationFn: (params) => api.userProfile.updatePhone(params),
        onSuccess: (data, variables) => {
            logger.info("User phone updated via mutation", data.phone);
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to update user phone via mutation"); }
    });
};

export const useDeleteUserPhone = (): UseMutationResult<DeleteResponse, ApiError, DeletePhoneParams> => {
    const api = useApi();
    return useMutation<DeleteResponse, ApiError, DeletePhoneParams>({
        mutationFn: (params) => api.userProfile.deletePhone(params),
        onSuccess: (data, variables) => {
            logger.info("User phone deleted via mutation", { phoneId: variables.phone_id });
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEYS.phones() } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.me } as InvalidateQueryFilters);
        },
        onError: (error) => { logger.error({ error }, "Failed to delete user phone via mutation"); }
    });
};


// ==============================
// == Namespace Users (Admin)  ==
// ==============================

// Clés de Query communes
const USERS_QUERY_KEYS = {
    all: ['users'] as const,
    lists: (filters: UserFilterType = {}) => [...USERS_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { user_id: string }) => [...USERS_QUERY_KEYS.all, 'detail', params] as const, // Si on ajoute un getOne
};


// ========================
// == Namespace Inventaires ==
// ========================

// Clés de Query communes
const INVENTORIES_QUERY_KEYS = {
    all: ['inventories'] as const,
    lists: (filters: GetInventoriesParams = {}) => [...INVENTORIES_QUERY_KEYS.all, 'list', filters] as const,
    details: (params: { inventory_id: string }) => [...INVENTORIES_QUERY_KEYS.all, 'detail', params] as const,
};

// Hook pour récupérer la LISTE des inventaires
export const useGetInventories = (
    filter: Omit<GetInventoriesParams, 'inventory_id'> = {}, // Exclure ID pour la liste
    options: { enabled?: boolean, keepPreviousData?: boolean } = {}
): UseQueryResult<GetInventoriesResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetInventoriesResponse, ApiError>({
        queryKey: INVENTORIES_QUERY_KEYS.lists(filter),
        queryFn: () => api.inventories.getList(filter),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

// Hook pour récupérer UN inventaire par ID
export const useGetInventory = (
    params: { inventory_id: string },
    options: { enabled?: boolean } = {}
): UseQueryResult<GetInventoryResponse, ApiError> => {
    const api = useApi();
    return useQuery<GetInventoryResponse, ApiError>({
        queryKey: INVENTORIES_QUERY_KEYS.details(params),
        queryFn: () => api.inventories.getOne(params),
        enabled: !!params.inventory_id && (options.enabled !== undefined ? options.enabled : true),
    });
};

