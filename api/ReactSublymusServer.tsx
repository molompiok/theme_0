// api/ReactSublymusServer.tsx

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
    QueryClient, QueryClientProvider, useQuery, useMutation,
    UseQueryResult, UseMutationResult, InvalidateQueryFilters, QueryKey,
    useQueryClient
} from '@tanstack/react-query';
// ReactQueryDevtools est optionnel, peut être ajouté dans le composant racine de l'app
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import {
    SublymusServerApi,
    ServerApiError,
    MessageResponse, // Type générique
    // AdminControls Namespace Types
    AdminGlobalStatusResponse,
    AdminRestartServicesResponse,
    AdminGarbageCollectDirsResponse,
    AdminDeleteGarbageDirsParams,
    AdminDeleteGarbageDirsResponse,
    // ServerApis Namespace Types
    ServerApiDefinitionInterface,
    CreateServerApiDefinitionData,
    UpdateServerApiDefinitionData,
    GetServerApiDefinitionsParams,
    // ServerAuth Namespace Types
    ServerRegisterParams,
    ServerLoginParams,
    ServerRegisterResponse,
    ServerLoginResponse,
    ServerMeResponse,
    ServerGoogleRedirectParams,
    // ServerStores Namespace Types
    CreateServerStoreData,
    UpdateServerStoreData,
    GetServerStoresParams,
    ServerStoreActionResponse,
    // ServerThemes Namespace Types
    UpsertServerThemeData,
    CreateServerThemeData,
    UpdateServerThemeData,
    GetServerThemesParams,
    // ServerUsers Namespace Types
    UpdateServerUserProfileData,
    UpdateServerUserPasswordData,
    GetAllServerUsersParams,
    // ... (imports existants)
    // Preinscriptions Namespace Types
    CreatePreinscriptionData,
    ValidatePreinscriptionPaymentData,
    GetPreinscriptionsParams,
    // ContactMessages Namespace Types
    CreateContactMessageData,
    UpdateContactMessageStatusData,
    GetContactMessagesParams,
    ServerApiSuccessResponse,
    // TryService Namespace Types (MessageResponse est suffisant ici)
} from './SublymusServer'; // Ajustez le chemin si nécessaire

// --- Importation des types partagés depuis Interfaces.ts ---
import type {
    UserInterface,
    StoreInterface,
    ThemeInterface,
    ListType,
    PreinscriptionInterface,
    PreinscriptionSummaryInterface, // Ajouté
    ContactMessageInterface,
} from './Interfaces'; // Ajustez le chemin si nécessaire

// Store pour le token serveur (similaire à AuthStore pour l'API client)
// Supposons que vous avez un moyen de stocker et récupérer le token pour s_server.
// Pour cet exemple, nous utiliserons une fonction factice.
// import { useServerAuthStore } from '../stores/ServerAuthStore'; // Exemple
import { useTranslation } from 'react-i18next';
import logger from './Logger';


// --- Client TanStack Query (Peut être le même que pour ReactSublymusApi) ---
// --- Client TanStack Query (inchangé) ---
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Ne pas réessayer pour les erreurs 4xx (sauf 429 - Too Many Requests)
                if (error instanceof ServerApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
                    return false;
                }
                // Réessayer 3 fois pour les autres erreurs
                return failureCount < 3;
            }
        },
    },
});

interface SublymusServerApiContextType {
    serverApi: SublymusServerApi | null;
}
const SublymusServerApiContext = createContext<SublymusServerApiContextType>({ serverApi: null });

// --- Provider pour l'API Serveur ---
interface SublymusServerApiProviderProps {
    children: ReactNode;
    serverUrl: string; // URL du s_server
    // Fonction pour obtenir le token pour s_server
    // Dans un vrai scénario, cela viendrait d'un store d'authentification (Zustand, Redux, etc.)
    getAuthToken: () => string | null;
    handleUnauthorized?: (action: 'server', token?: string) => void; // Optionnel
}

export const SublymusServerApiProvider: React.FC<SublymusServerApiProviderProps> = ({
    children,
    serverUrl,
    getAuthToken,
    handleUnauthorized,
}) => {
    const { t } = useTranslation(); // Pour les messages d'erreur de l'API

    const serverApiInstance = useMemo(() => {
        if (!serverUrl) {
            logger.error("SublymusServerApiProvider: serverUrl prop is missing!");
            // Peut-être lancer une erreur ou retourner null et laisser useServerApi gérer
            return null;
        }

        return new SublymusServerApi({
            serverUrl,
            getAuthTokenServer: getAuthToken,
            t,
            handleUnauthorized: handleUnauthorized || ((action, token) => {
                // Comportement par défaut si non fourni
                console.warn(`Unauthorized server action. Action: ${action}, Token used: ${!!token}`);
                // Exemple de redirection, mais cela devrait être géré par l'application consommatrice
                // window.location.href = '/login?serverSessionExpired=true';
            }),
        });
    }, [serverUrl, getAuthToken, t, handleUnauthorized]);

    // Si vous utilisez un QueryClientProvider séparé pour le serveur API:
    return (
      <QueryClientProvider client={queryClient}> {/* Assurez-vous que queryClient est défini */}
        <SublymusServerApiContext.Provider value={{ serverApi: serverApiInstance }}>
          {children}
        </SublymusServerApiContext.Provider>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    );

    // Si le QueryClientProvider est global (dans App.tsx par exemple):
    return (
        <SublymusServerApiContext.Provider value={{ serverApi: serverApiInstance }}>
            {children}
        </SublymusServerApiContext.Provider>
    );
};

// --- Hook useServerApi ---
export const useServerApi = (): SublymusServerApi => {
    const context = useContext(SublymusServerApiContext);
    const { t } = useTranslation();

    if (!context || !context.serverApi) {
        // Cette erreur signifie que le hook est utilisé en dehors d'un SublymusServerApiProvider
        throw new Error(t('api.contextError.serverProviderMissing', 'useServerApi must be used within a SublymusServerApiProvider'));
    }
    return context.serverApi;
};


// ==================================
// == Preinscriptions Namespace ==
// ==================================
const SERVER_PREINSCRIPTIONS_QUERY_KEYS = {
    all: ['serverPreinscriptions'] as const,
    summary: () => [...SERVER_PREINSCRIPTIONS_QUERY_KEYS.all, 'summary'] as const,
    adminLists: (filters: GetPreinscriptionsParams = {}) => [...SERVER_PREINSCRIPTIONS_QUERY_KEYS.all, 'adminList', filters] as const,
    adminDetails: (id: string) => [...SERVER_PREINSCRIPTIONS_QUERY_KEYS.all, 'adminDetail', id] as const,
};

export const useCreatePreinscription = (): UseMutationResult<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, CreatePreinscriptionData> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, CreatePreinscriptionData>({
        mutationFn: (data) => serverApi.preinscriptions.create(data),
        onSuccess: () => {
            // Invalider le résumé pour qu'il se mette à jour si la nouvelle préinscription
            // doit y apparaître immédiatement (ex: si pas de statut de paiement initial)
            queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.summary() } as InvalidateQueryFilters);
            // Pourrait aussi invalider la liste admin si l'admin la consulte
            queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
        }
    });
};

export const useGetPreinscriptionSummary = (
    options: { enabled?: boolean; refetchInterval?: number | false } = {}
): UseQueryResult<ServerApiSuccessResponse<PreinscriptionSummaryInterface, 'data'>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ServerApiSuccessResponse<PreinscriptionSummaryInterface, 'data'>, ServerApiError>({
        queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.summary(),
        queryFn: () => serverApi.preinscriptions.getSummary(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        refetchInterval: options.refetchInterval,
    });
};

// --- Hooks Admin pour Preinscriptions ---
export const useValidatePreinscriptionPayment = (): UseMutationResult<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, { id: string; data: ValidatePreinscriptionPaymentData }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, { id: string; data: ValidatePreinscriptionPaymentData }>({
        mutationFn: (params) => serverApi.preinscriptions.validatePayment(params.id, params.data),
        onSuccess: (response) => {
            const updatedPreinscription = response.data;
            if (updatedPreinscription) {
                queryClient.setQueryData(SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminDetails(updatedPreinscription.id), updatedPreinscription);
                queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
                queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.summary() } as InvalidateQueryFilters); // Le résumé change aussi
            }
        }
    });
};

export const useGetAdminPreinscriptionsList = (
    params: GetPreinscriptionsParams = {},
    options: { enabled?: boolean; keepPreviousData?: boolean } = {}
): UseQueryResult<ListType<PreinscriptionInterface>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ListType<PreinscriptionInterface>, ServerApiError>({
        queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminLists(params),
        queryFn: () => serverApi.preinscriptions.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

export const useGetAdminPreinscription = (
    id: string | undefined,
    options: { enabled?: boolean } = {}
): UseQueryResult<PreinscriptionInterface | null, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<PreinscriptionInterface | null, ServerApiError>({
        queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminDetails(id!),
        queryFn: () => (id ? serverApi.preinscriptions.getOne(id) : Promise.resolve(null)),
        enabled: !!id && (options.enabled !== undefined ? options.enabled : true),
    });
};

export const useUpdateAdminPreinscription = (): UseMutationResult<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, { id: string; data: Partial<Pick<PreinscriptionInterface, 'name' | 'email' | 'shop_name' | 'display_info' | 'admin_notes'>> }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>, ServerApiError, { id: string; data: Partial<Pick<PreinscriptionInterface, 'name' | 'email' | 'shop_name' | 'display_info' | 'admin_notes'>> }>({
        mutationFn: (params) => serverApi.preinscriptions.update(params.id, params.data),
        onSuccess: (response) => {
            const updatedData = response.data;
            if (updatedData) {
                queryClient.setQueryData(SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminDetails(updatedData.id), updatedData);
                queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
                queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.summary() } as InvalidateQueryFilters);
            }
        },
    });
};

export const useDeleteAdminPreinscription = (): UseMutationResult<void, ServerApiError, { id: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, { id: string }>({
        mutationFn: (params) => serverApi.preinscriptions.delete(params.id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.adminDetails(variables.id) });
            queryClient.invalidateQueries({ queryKey: SERVER_PREINSCRIPTIONS_QUERY_KEYS.summary() } as InvalidateQueryFilters);
        },
    });
};


// ===================================
// == Contact Messages Namespace ==
// ===================================
const SERVER_CONTACT_MESSAGES_QUERY_KEYS = {
    all: ['serverContactMessages'] as const,
    adminLists: (filters: GetContactMessagesParams = {}) => [...SERVER_CONTACT_MESSAGES_QUERY_KEYS.all, 'adminList', filters] as const,
    adminDetails: (id: string) => [...SERVER_CONTACT_MESSAGES_QUERY_KEYS.all, 'adminDetail', id] as const,
};

export const useCreateContactMessage = (): UseMutationResult<ServerApiSuccessResponse<{ id: string }, 'data'>, ServerApiError, CreateContactMessageData> => {
    const serverApi = useServerApi();
    // Pas besoin d'invalider de queries ici car c'est juste un envoi,
    // sauf si l'admin a une liste qui se met à jour en temps réel (via SSE ou polling)
    return useMutation<ServerApiSuccessResponse<{ id: string }, 'data'>, ServerApiError, CreateContactMessageData>({
        mutationFn: (data) => serverApi.contactMessages.create(data),
    });
};

// --- Hooks Admin pour ContactMessages ---
export const useGetAdminContactMessagesList = (
    params: GetContactMessagesParams = {},
    options: { enabled?: boolean; keepPreviousData?: boolean } = {}
): UseQueryResult<ListType<ContactMessageInterface>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ListType<ContactMessageInterface>, ServerApiError>({
        queryKey: SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminLists(params),
        queryFn: () => serverApi.contactMessages.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

export const useGetAdminContactMessage = (
    id: string | undefined,
    options: { enabled?: boolean } = {}
): UseQueryResult<ContactMessageInterface | null, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ContactMessageInterface | null, ServerApiError>({
        queryKey: SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminDetails(id!),
        queryFn: () => (id ? serverApi.contactMessages.getOne(id) : Promise.resolve(null)),
        enabled: !!id && (options.enabled !== undefined ? options.enabled : true),
    });
};

export const useUpdateAdminContactMessageStatus = (): UseMutationResult<ServerApiSuccessResponse<ContactMessageInterface, 'data'>, ServerApiError, { id: string; data: UpdateContactMessageStatusData }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiSuccessResponse<ContactMessageInterface, 'data'>, ServerApiError, { id: string; data: UpdateContactMessageStatusData }>({
        mutationFn: (params) => serverApi.contactMessages.updateStatus(params.id, params.data),
        onSuccess: (response) => {
            const updatedMessage = response.data;
            if (updatedMessage) {
                queryClient.setQueryData(SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminDetails(updatedMessage.id), updatedMessage);
                queryClient.invalidateQueries({ queryKey: SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
            }
        }
    });
};

export const useDeleteAdminContactMessage = (): UseMutationResult<void, ServerApiError, { id: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, { id: string }>({
        mutationFn: (params) => serverApi.contactMessages.delete(params.id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminLists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: SERVER_CONTACT_MESSAGES_QUERY_KEYS.adminDetails(variables.id) });
        },
    });
};
// --- Hooks Personnalisés par Namespace pour SublymusServerApi ---

// ==============================
// == Admin Controls Namespace ==
// ==============================
const ADMIN_CONTROLS_QUERY_KEYS = {
    globalStatus: ['serverAdmin', 'globalStatus'] as const,
    garbageDirs: ['serverAdmin', 'garbageDirs'] as const,
    allUsers: (filters: GetAllServerUsersParams = {}) => ['serverAdmin', 'allUsers', filters] as const,
};

export const usePingStoreApi = (): UseMutationResult<MessageResponse, ServerApiError, { storeId: string }> => {
    const serverApi = useServerApi();
    return useMutation<MessageResponse, ServerApiError, { storeId: string }>({
        mutationFn: (params) => serverApi.admin.pingStoreApi(params.storeId),
    });
};

export const useGetServerGlobalStatus = (options: { enabled?: boolean, refetchInterval?: number | false } = {}): UseQueryResult<AdminGlobalStatusResponse, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<AdminGlobalStatusResponse, ServerApiError>({
        queryKey: ADMIN_CONTROLS_QUERY_KEYS.globalStatus,
        queryFn: () => serverApi.admin.getGlobalStatus(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        refetchInterval: options.refetchInterval,
    });
};

export const useRestartAllServerServices = (): UseMutationResult<AdminRestartServicesResponse, ServerApiError, void> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<AdminRestartServicesResponse, ServerApiError, void>({
        mutationFn: () => serverApi.admin.restartAllServices(),
        onSuccess: () => {
            // Peut-être invalider le statut global après cette action
            queryClient.invalidateQueries({ queryKey: ADMIN_CONTROLS_QUERY_KEYS.globalStatus } as InvalidateQueryFilters);
        }
    });
};

export const useRefreshNginxConfigs = (): UseMutationResult<MessageResponse, ServerApiError, void> => {
    const serverApi = useServerApi();
    return useMutation<MessageResponse, ServerApiError, void>({
        mutationFn: () => serverApi.admin.refreshNginxConfigs(),
    });
};

export const useListGarbageCollectDirs = (options: { enabled?: boolean } = {}): UseQueryResult<AdminGarbageCollectDirsResponse, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<AdminGarbageCollectDirsResponse, ServerApiError>({
        queryKey: ADMIN_CONTROLS_QUERY_KEYS.garbageDirs,
        queryFn: () => serverApi.admin.listGarbageCollectDirs(),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useDeleteGarbageDirs = (): UseMutationResult<AdminDeleteGarbageDirsResponse, ServerApiError, AdminDeleteGarbageDirsParams> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient(); // Get queryClient instance
    return useMutation<AdminDeleteGarbageDirsResponse, ServerApiError, AdminDeleteGarbageDirsParams>({
        mutationFn: (params) => serverApi.admin.deleteGarbageDirs(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_CONTROLS_QUERY_KEYS.garbageDirs } as InvalidateQueryFilters);
        }
    });
};
export const useGetAllServerUsers = (
    queryParams: GetAllServerUsersParams = {},
    options: { enabled?: boolean; keepPreviousData?: boolean } = {}
): UseQueryResult<{ users: ListType<UserInterface> }, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<{ users: ListType<UserInterface> }, ServerApiError>({
        queryKey: ADMIN_CONTROLS_QUERY_KEYS.allUsers(queryParams),
        queryFn: () => serverApi.admin.getAllUsers(queryParams),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};


// ===================================
// == Server APIs (Definitions) Namespace ==
// ===================================
const SERVER_API_DEFINITIONS_QUERY_KEYS = {
    all: ['serverApiDefinitions'] as const,
    lists: (filters: GetServerApiDefinitionsParams = {}) => [...SERVER_API_DEFINITIONS_QUERY_KEYS.all, 'list', filters] as const,
    details: (id: string) => [...SERVER_API_DEFINITIONS_QUERY_KEYS.all, 'detail', id] as const,
};

export const useCreateServerApiDefinition = (): UseMutationResult<ServerApiDefinitionInterface, ServerApiError, CreateServerApiDefinitionData> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiDefinitionInterface, ServerApiError, CreateServerApiDefinitionData>({
        mutationFn: (data) => serverApi.apis.create(data),
        onSuccess: (newApiDef) => {
            queryClient.invalidateQueries({ queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_API_DEFINITIONS_QUERY_KEYS.details(newApiDef.id), newApiDef);
        }
    });
};

export const useUpdateServerApiDefinition = (): UseMutationResult<ServerApiDefinitionInterface, ServerApiError, { apiId: string; data: UpdateServerApiDefinitionData }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerApiDefinitionInterface, ServerApiError, { apiId: string; data: UpdateServerApiDefinitionData }>({
        mutationFn: (params) => serverApi.apis.update(params.apiId, params.data),
        onSuccess: (updatedApiDef) => {
            queryClient.invalidateQueries({ queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_API_DEFINITIONS_QUERY_KEYS.details(updatedApiDef.id), updatedApiDef);
        }
    });
};

export const useGetServerApiDefinitionsList = (
    params: GetServerApiDefinitionsParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<ListType<ServerApiDefinitionInterface>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ListType<ServerApiDefinitionInterface>, ServerApiError>({
        queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.lists(params),
        queryFn: () => serverApi.apis.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useGetServerApiDefinition = (apiId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<ServerApiDefinitionInterface | null, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ServerApiDefinitionInterface | null, ServerApiError>({
        queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.details(apiId!),
        queryFn: () => apiId ? serverApi.apis.getOne(apiId) : Promise.resolve(null),
        enabled: !!apiId && (options.enabled !== undefined ? options.enabled : true),
    });
};

export const useDeleteServerApiDefinition = (): UseMutationResult<void, ServerApiError, { apiId: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, { apiId: string }>({
        mutationFn: (params) => serverApi.apis.delete(params.apiId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: SERVER_API_DEFINITIONS_QUERY_KEYS.details(variables.apiId) });
        }
    });
};


// ===========================
// == Server Auth Namespace ==
// ===========================
const SERVER_AUTH_QUERY_KEYS = {
    me: ['serverAuthMe'] as const,
};

export const useServerRegister = (): UseMutationResult<ServerRegisterResponse, ServerApiError, ServerRegisterParams> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerRegisterResponse, ServerApiError, ServerRegisterParams>({
        mutationFn: (params) => serverApi.auth.register(params),
        onSuccess: (data) => {
            queryClient.setQueryData(SERVER_AUTH_QUERY_KEYS.me, { user: data.user, roles: data.user.roles?.map(r => r.name), current_token_info: { expires_at: data.expires_at } });
            // Potentiellement, stocker le token dans votre store d'authentification serveur
        }
    });
};

export const useServerLogin = (): UseMutationResult<ServerLoginResponse, ServerApiError, ServerLoginParams> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerLoginResponse, ServerApiError, ServerLoginParams>({
        mutationFn: (params) => serverApi.auth.login(params),
        onSuccess: (data) => {
            queryClient.setQueryData(SERVER_AUTH_QUERY_KEYS.me, { user: data.user, roles: data.user.roles?.map(r => r.name), current_token_info: { expires_at: data.expires_at } });
            // Stocker le token
        }
    });
};

export const useServerLogout = (): UseMutationResult<MessageResponse, ServerApiError, void> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<MessageResponse, ServerApiError, void>({
        mutationFn: () => serverApi.auth.logout(),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: SERVER_AUTH_QUERY_KEYS.me });
            // Effacer le token stocké
        },
        onError: () => { // Même en cas d'erreur, nettoyer côté client
            queryClient.removeQueries({ queryKey: SERVER_AUTH_QUERY_KEYS.me });
        }
    });
};

export const useGetServerMe = (options: { enabled?: boolean } = {}): UseQueryResult<ServerMeResponse, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ServerMeResponse, ServerApiError>({
        queryKey: SERVER_AUTH_QUERY_KEYS.me,
        queryFn: () => serverApi.auth.getMe(),
        enabled: options.enabled !== undefined ? options.enabled : true,
        staleTime: 15 * 60 * 1000,
    });
};

// Note: getGoogleRedirectUrl n'est pas un hook useQuery/useMutation, c'est une fonction synchrone.
// Elle peut être appelée directement: const url = serverApi.auth.getGoogleRedirectUrl(params);

// ==============================
// == Server Stores Namespace ==
// ==============================
// (Les clés et hooks sont similaires à ReactSublymusApi, mais utilisent serverApi)
const SERVER_STORES_QUERY_KEYS = {
    all: ['serverStores'] as const,
    lists: (filters: GetServerStoresParams = {}) => [...SERVER_STORES_QUERY_KEYS.all, 'list', filters] as const,
    details: (id: string) => [...SERVER_STORES_QUERY_KEYS.all, 'detail', id] as const,
    availableName: (name: string) => [...SERVER_STORES_QUERY_KEYS.all, 'availableName', name] as const,
};

export const useCreateServerStore = (): UseMutationResult<StoreInterface, ServerApiError, CreateServerStoreData> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, CreateServerStoreData>({
        mutationFn: (data) => serverApi.stores.create(data),
        onSuccess: (newStore) => {
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(newStore.id!), newStore);
        }
    });
};

export const useGetServerStoresList = (
    params: GetServerStoresParams = {},
    options: { enabled?: boolean; keepPreviousData?: boolean } = {}
): UseQueryResult<ListType<StoreInterface>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ListType<StoreInterface>, ServerApiError>({
        queryKey: SERVER_STORES_QUERY_KEYS.lists(params),
        queryFn: () => serverApi.stores.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
        // keepPreviousData: options.keepPreviousData ?? true,
    });
};

export const useGetServerStore = (storeId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<StoreInterface | null, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<StoreInterface | null, ServerApiError>({
        queryKey: SERVER_STORES_QUERY_KEYS.details(storeId!),
        queryFn: () => storeId ? serverApi.stores.getOne(storeId) : Promise.resolve(null),
        enabled: !!storeId && (options.enabled !== undefined ? options.enabled : true),
    });
};

export const useUpdateServerStore = (): UseMutationResult<StoreInterface, ServerApiError, { storeId: string; data: UpdateServerStoreData }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, { storeId: string; data: UpdateServerStoreData }>({
        mutationFn: (params) => serverApi.stores.update(params.storeId, params.data),
        onSuccess: (updatedStore) => {
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(updatedStore.id!), updatedStore);
        }
    });
};

export const useDeleteServerStore = (): UseMutationResult<void, ServerApiError, { storeId: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, { storeId: string }>({
        mutationFn: (params) => serverApi.stores.delete(params.storeId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: SERVER_STORES_QUERY_KEYS.details(variables.storeId) });
        }
    });
};

export const useChangeServerStoreTheme = (): UseMutationResult<StoreInterface, ServerApiError, { storeId: string; themeId: string | null }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, { storeId: string; themeId: string | null }>({
        mutationFn: (params) => serverApi.stores.changeTheme(params.storeId, params.themeId),
        onSuccess: (updatedStore) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(updatedStore.id!), updatedStore);
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Si le thème est affiché dans la liste
        }
    });
};

export const useChangeServerStoreApi = (): UseMutationResult<StoreInterface, ServerApiError, { storeId: string; apiId: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, { storeId: string; apiId: string }>({
        mutationFn: (params) => serverApi.stores.changeApi(params.storeId, params.apiId),
        onSuccess: (updatedStore) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(updatedStore.id!), updatedStore);
        }
    });
};

export const useUpdateServerStoreStatus = (): UseMutationResult<ServerStoreActionResponse, ServerApiError, { storeId: string; isActive: boolean }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerStoreActionResponse, ServerApiError, { storeId: string; isActive: boolean }>({
        mutationFn: (params) => serverApi.stores.updateStatus(params.storeId, params.isActive),
        onSuccess: (response) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(response.store.id!), response.store);
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        }
    });
};

export const useScaleServerStore = (): UseMutationResult<ServerStoreActionResponse, ServerApiError, { storeId: string; replicas: number }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ServerStoreActionResponse, ServerApiError, { storeId: string; replicas: number }>({
        mutationFn: (params) => serverApi.stores.scale(params.storeId, params.replicas),
        onSuccess: (response) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(response.store.id!), response.store);
        }
    });
};

// Hooks pour start, stop, restart
const createStoreActionHook = (
    actionFn: (storeId: string) => Promise<ServerStoreActionResponse>
) => {
    const queryClient = useQueryClient();
    return useMutation<ServerStoreActionResponse, ServerApiError, { storeId: string }>({
        mutationFn: (params) => actionFn(params.storeId),
        onSuccess: (response) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(response.store.id!), response.store);
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.lists() } as InvalidateQueryFilters); // is_running peut changer
        }
    });
};

export const useStartServerStore = () => {
    const serverApi = useServerApi();
    return createStoreActionHook((storeId) => serverApi.stores.start(storeId));
};
export const useStopServerStore = () => {
    const serverApi = useServerApi();
    return createStoreActionHook((storeId) => serverApi.stores.stop(storeId));
};
export const useRestartServerStore = () => {
    const serverApi = useServerApi();
    return createStoreActionHook((storeId) => serverApi.stores.restart(storeId));
};


export const useAddServerStoreDomain = (): UseMutationResult<StoreInterface, ServerApiError, { storeId: string; domainName: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, { storeId: string; domainName: string }>({
        mutationFn: (params) => serverApi.stores.addDomain(params.storeId, params.domainName),
        onSuccess: (updatedStore) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(updatedStore.id!), updatedStore);
        }
    });
};

export const useRemoveServerStoreDomain = (): UseMutationResult<StoreInterface, ServerApiError, { storeId: string; domainName: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<StoreInterface, ServerApiError, { storeId: string; domainName: string }>({
        mutationFn: (params) => serverApi.stores.removeDomain(params.storeId, params.domainName),
        onSuccess: (updatedStore) => {
            queryClient.setQueryData(SERVER_STORES_QUERY_KEYS.details(updatedStore.id!), updatedStore);
        }
    });
};

export const useCheckServerStoreNameAvailability = (
    name: string | undefined,
    options: { enabled?: boolean } = {}
): UseQueryResult<{ is_available_name: boolean }, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<{ is_available_name: boolean }, ServerApiError>({
        queryKey: SERVER_STORES_QUERY_KEYS.availableName(name!),
        queryFn: () => name ? serverApi.stores.checkAvailableName(name) : Promise.resolve({ is_available_name: false }),
        enabled: !!name && (options.enabled !== undefined ? options.enabled : true),
        staleTime: 1 * 60 * 1000,
    });
};


// ===============================
// == Server Themes Namespace ==
// ===============================
const SERVER_THEMES_QUERY_KEYS = {
    all: ['serverThemes'] as const,
    lists: (filters: GetServerThemesParams = {}) => [...SERVER_THEMES_QUERY_KEYS.all, 'list', filters] as const,
    details: (id: string) => [...SERVER_THEMES_QUERY_KEYS.all, 'detail', id] as const,
};

export const useCreateServerTheme = (): UseMutationResult<ThemeInterface, ServerApiError, CreateServerThemeData> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ThemeInterface, ServerApiError, CreateServerThemeData>({
        mutationFn: (data) => serverApi.themes.create(data),
        onSuccess: (newTheme) => {
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_THEMES_QUERY_KEYS.details(newTheme.id), newTheme);
        }
    });
};

export const useUpdateServerTheme = (): UseMutationResult<ThemeInterface, ServerApiError, { themeId: string; data: UpdateServerThemeData }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ThemeInterface, ServerApiError, { themeId: string; data: UpdateServerThemeData }>({
        mutationFn: (params) => serverApi.themes.update(params.themeId, params.data),
        onSuccess: (updatedTheme) => {
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.setQueryData(SERVER_THEMES_QUERY_KEYS.details(updatedTheme.id), updatedTheme);
        }
    });
};

export const useGetServerThemesList = (
    params: GetServerThemesParams = {},
    options: { enabled?: boolean } = {}
): UseQueryResult<ListType<ThemeInterface>, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ListType<ThemeInterface>, ServerApiError>({
        queryKey: SERVER_THEMES_QUERY_KEYS.lists(params),
        queryFn: () => serverApi.themes.getList(params),
        enabled: options.enabled !== undefined ? options.enabled : true,
    });
};

export const useGetServerTheme = (themeId: string | undefined, options: { enabled?: boolean } = {}): UseQueryResult<ThemeInterface | null, ServerApiError> => {
    const serverApi = useServerApi();
    return useQuery<ThemeInterface | null, ServerApiError>({
        queryKey: SERVER_THEMES_QUERY_KEYS.details(themeId!),
        queryFn: () => themeId ? serverApi.themes.getOne(themeId) : Promise.resolve(null),
        enabled: !!themeId && (options.enabled !== undefined ? options.enabled : true),
    });
};

export const useDeleteServerTheme = (): UseMutationResult<void, ServerApiError, { themeId: string; force?: boolean }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, { themeId: string; force?: boolean }>({
        mutationFn: (params) => serverApi.themes.delete(params.themeId, params.force),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
            queryClient.removeQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.details(variables.themeId) });
            // Invalider les stores car un thème supprimé peut les affecter
            queryClient.invalidateQueries({ queryKey: SERVER_STORES_QUERY_KEYS.all } as InvalidateQueryFilters);
        }
    });
};

export const useUpdateServerThemeVersion = (): UseMutationResult<ThemeInterface, ServerApiError, { themeId: string; dockerImageTag: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ThemeInterface, ServerApiError, { themeId: string; dockerImageTag: string }>({
        mutationFn: (params) => serverApi.themes.updateVersion(params.themeId, params.dockerImageTag),
        onSuccess: (updatedTheme) => {
            queryClient.setQueryData(SERVER_THEMES_QUERY_KEYS.details(updatedTheme.id), updatedTheme);
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        }
    });
};

export const useSetDefaultServerTheme = (): UseMutationResult<ThemeInterface, ServerApiError, { themeId: string }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ThemeInterface, ServerApiError, { themeId: string }>({
        mutationFn: (params) => serverApi.themes.setDefault(params.themeId),
        onSuccess: (updatedTheme) => {
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters); // is_default a changé pour plusieurs thèmes
            queryClient.setQueryData(SERVER_THEMES_QUERY_KEYS.details(updatedTheme.id), updatedTheme);
        }
    });
};

export const useUpdateServerThemeStatus = (): UseMutationResult<ThemeInterface, ServerApiError, { themeId: string; isActive: boolean }> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<ThemeInterface, ServerApiError, { themeId: string; isActive: boolean }>({
        mutationFn: (params) => serverApi.themes.updateStatus(params.themeId, params.isActive),
        onSuccess: (updatedTheme) => {
            queryClient.setQueryData(SERVER_THEMES_QUERY_KEYS.details(updatedTheme.id), updatedTheme);
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters);
        }
    });
};

const createThemeActionHook = (
    actionFn: (themeId: string) => Promise<MessageResponse>
) => {
    const queryClient = useQueryClient();
    return useMutation<MessageResponse, ServerApiError, { themeId: string }>({
        mutationFn: (params) => actionFn(params.themeId),
        onSuccess: (_, variables) => {
            // Invalider les détails du thème car son statut 'is_running' pourrait changer
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.details(variables.themeId) } as InvalidateQueryFilters);
            queryClient.invalidateQueries({ queryKey: SERVER_THEMES_QUERY_KEYS.lists() } as InvalidateQueryFilters); // Si is_running est affiché
        }
    });
};

export const useStartServerTheme = () => {
    const serverApi = useServerApi();
    return createThemeActionHook((themeId) => serverApi.themes.start(themeId));
};
export const useStopServerTheme = () => {
    const serverApi = useServerApi();
    return createThemeActionHook((themeId) => serverApi.themes.stop(themeId));
};
export const useRestartServerTheme = () => {
    const serverApi = useServerApi();
    return createThemeActionHook((themeId) => serverApi.themes.restart(themeId));
};


// ===============================
// == Server Users Namespace ==
// ===============================
// (Les hooks pour /auth/me sont sous ServerAuthNamespace. Ici, actions sur le profil de l'utilisateur connecté à s_server)

export const useUpdateServerUserProfile = (): UseMutationResult<{ user: UserInterface }, ServerApiError, UpdateServerUserProfileData> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<{ user: UserInterface }, ServerApiError, UpdateServerUserProfileData>({
        mutationFn: (data) => serverApi.users.updateMe(data),
        onSuccess: (response) => {
            queryClient.setQueryData<ServerMeResponse>(SERVER_AUTH_QUERY_KEYS.me, (oldData) =>
                oldData ? { ...oldData, user: { ...oldData.user, ...response.user } } : undefined
            );
            // Mettre à jour le store d'authentification serveur si utilisé
        }
    });
};

export const useUpdateServerUserPassword = (): UseMutationResult<MessageResponse, ServerApiError, UpdateServerUserPasswordData> => {
    const serverApi = useServerApi();
    return useMutation<MessageResponse, ServerApiError, UpdateServerUserPasswordData>({
        mutationFn: (data) => serverApi.users.updateMyPassword(data),
        // onSuccess: Peut-être déconnecter ou demander une nouvelle connexion
    });
};

export const useDeleteServerMe = (): UseMutationResult<void, ServerApiError, void> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<void, ServerApiError, void>({
        mutationFn: () => serverApi.users.deleteMe(),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: SERVER_AUTH_QUERY_KEYS.me });
            queryClient.clear(); // Vider tout le cache serveur
            // Effacer le token, déconnecter l'utilisateur de s_server
        }
    });
};

export const useServerLogoutAllDevices = (): UseMutationResult<MessageResponse, ServerApiError, void> => {
    const serverApi = useServerApi();
    const queryClient = useQueryClient();
    return useMutation<MessageResponse, ServerApiError, void>({
        mutationFn: () => serverApi.users.logoutAllDevices(),
        onSuccess: () => {
            // Pour l'utilisateur courant, cela équivaut à un logout normal.
            queryClient.removeQueries({ queryKey: SERVER_AUTH_QUERY_KEYS.me });
            // Effacer le token stocké
        }
    });
};


// =============================
// == Try Service Namespace ==
// =============================
export const useTestServerEmail = (): UseMutationResult<MessageResponse, ServerApiError, { recipientEmail: string }> => {
    const serverApi = useServerApi();
    return useMutation<MessageResponse, ServerApiError, { recipientEmail: string }>({
        mutationFn: (params) => serverApi.tryService.testEmail(params.recipientEmail),
    });
};