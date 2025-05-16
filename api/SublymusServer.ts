// api/SublymusServerApi.ts

// --- Références aux types existants (supposons qu'ils sont importables) ---
import type {
    UserInterface,
    StoreInterface,
    ThemeInterface,
    ListType,
 PreinscriptionInterface,
  PreinscriptionSummaryInterface, // Ajouté
  PreinscriptionPaymentStatus,    // Ajouté pour le type
  PreinscriptionTier,             // Ajouté pour le type
  PreinscriptionPaymentMethod,    // Ajouté pour le type
  ContactMessageInterface,
  ContactMessageStatus,           // Ajouté pour le type
} from './Interfaces';

// --- Types Génériques & Erreur (similaires à SublymusApi) ---
export type ServerApiSuccessResponse<T, Key extends string = 'data'> = {
    message?: string;
    error?: never;
    status?: number;
} & {
    [K in Key]?: T;
};
export type ServerApiErrorResponse = { message: string; data?: never; error: string | object | null; status: number; }
export type ServerApiResponse<T, K extends string = 'data'> = ServerApiSuccessResponse<T, K> | ServerApiErrorResponse;

export class ServerApiError extends Error {
    status: number;
    body: any;
    constructor(message: string, status: number, body: any = null) {
        super(message); this.name = 'ServerApiError'; this.status = status; this.body = body;
    }
}

export type MessageResponse = { message: string }; // Réutilisé

// --- Interfaces Spécifiques au Serveur ---

// Pour AdminControlsController
export interface AdminGlobalStatusResponse {
    status: 'ok' | 'error';
    docker_swarm_status: 'connected' | 'error';
    swarm_node_count: number | null;
    stores: { total: number; active: number; running: number };
    themes: { total: number; active: number; running: number };
    message?: string;
    error?: string;
}

export interface AdminRestartServicesResponse {
    message: string;
    details: {
        stores: { success: number; failed: number };
        themes: { success: number; failed: number };
    };
    error?: string;
}

export interface AdminGarbageCollectDirsResponse {
    message: string;
    suspects: {
        nginxAvailable: string[];
        nginxEnabled: string[];
        apiVolumes: string[];
    };
}

export interface AdminDeleteGarbageDirsParams {
    paths_to_delete?: string[];
    confirmation_keys?: string[];
}

export interface AdminDeleteGarbageDirsResponse {
    message: string;
    deleted: string[];
    failed: Array<{ path: string; success: boolean; error?: string }>;
    confirmation_required: Array<{ path: string; key: string, expire_at: number }>;
    expired_keys: string[];
}

// Pour ApiController (gestion des définitions d'API)
export interface ServerApiDefinitionInterface {
    id: string;
    name: string;
    description: string | null;
    docker_image_name: string;
    docker_image_tag: string;
    internal_port: number;
    source_path: string | null;
    is_default: boolean;
    created_at: string; // Ajouté basé sur les modèles Lucid typiques
    updated_at: string; // Ajouté
}

export type CreateServerApiDefinitionData = Omit<ServerApiDefinitionInterface, 'id' | 'created_at' | 'updated_at'>;
export type UpdateServerApiDefinitionData = Partial<CreateServerApiDefinitionData>;

export interface GetServerApiDefinitionsParams {
    page?: number;
    limit?: number;
    order_by?: string;
    name?: string;
}

// Pour AuthController (s_server)
export interface ServerRegisterParams { // Identique à RegisterParams de SublymusApi
    full_name: string;
    email: string;
    password: string;
    password_confirmation: string;
}
export interface ServerLoginParams { // Identique à LoginParams de SublymusApi
    email: string;
    password: string;
}

export interface ServerRegisterResponse {
    user: UserInterface;
    type: 'bearer';
    token: string;
    expires_at: string | null;
}
export type ServerLoginResponse = ServerRegisterResponse; // La structure est la même

export interface ServerMeResponse {
    user: UserInterface;
    roles: string[]; // Noms des rôles
    current_token_info: {
        expires_at: string | null;
    };
}

export interface ServerGoogleRedirectParams {
    store_id: string;
    client_success: string;
    client_error: string;
}


// Pour StoresController (s_server)
export type CreateServerStoreData = { // Basé sur createStoreValidator
    name: string;
    title: string;
    description: string;
    logo?: File | Blob; // Sera géré par FormData
    cover_image?: File | Blob; // Sera géré par FormData
    favicon?: File | Blob; // Sera géré par FormData
    timezone?: string;
    currency?: string;
};

export type UpdateServerStoreData = Partial<Omit<CreateServerStoreData, 'name'>> & { name?: string }; // name est spécial

export interface GetServerStoresParams {
    page?: number;
    limit?: number;
    order_by?: string;
    name?: string;
    user_id?: string; // Peut être 'all'
    store_id?: string;
    slug?: string;
    search?: string;
    current_theme_id?: string; // Normalement ID, mais le contrôleur utilise parseInt
    current_api_id?: string;   // Normalement ID
    is_active?: boolean;
    is_running?: boolean;
}
export interface ServerStoreActionResponse { // Pour start, stop, restart, scale
    store: StoreInterface;
    message: string;
}

// Pour ThemesController (s_server)
export type UpsertServerThemeData = { // Basé sur themePutValidator et themePostValidator
    id?: string; // Pour PUT, ou si id sémantique pour POST
    name: string;
    preview_images?: (File | Blob)[]; // Sera géré par FormData
    description?: string | null;
    docker_image_name: string;
    docker_image_tag: string;
    internal_port: number;
    source_path?: string | null;
    is_public?: boolean;
    is_premium?: boolean;
    price?: number;
    is_active?: boolean;
    is_default?: boolean;
};
export type CreateServerThemeData = Required<Omit<UpsertServerThemeData, 'id' | 'preview_images'| 'description'| 'source_path'|'is_public'| 'is_active'| 'is_default'| 'is_premium'| 'price'>> & Pick<UpsertServerThemeData, 'id' | 'preview_images'| 'description'| 'source_path'|'is_public'| 'is_active'| 'is_default'| 'is_premium'| 'price'>; // `name` devient requis pour POST
export type UpdateServerThemeData = Partial<UpsertServerThemeData>;


export interface GetServerThemesParams {
    page?: number;
    limit?: number;
    public?: boolean;
    active?: boolean;
    default?: boolean;
}

// Pour UsersController (s_server)
export interface UpdateServerUserProfileData { // Basé sur updateProfileValidator
    fullName?: string;
    phone?: string | null;
    // photos gérées via FormData si upload direct, ou string[] si URLs
}

export interface UpdateServerUserPasswordData { // Basé sur updatePasswordValidator
    currentPassword: string;
    newPassword: string;
    newPassword_confirmation: string;
}

export interface GetAllServerUsersParams {
    page?: number;
    limit?: number;
    order_by?: string;
    name?: string;
    email?: string;
    phone?: string;
    user_id?: string;
}
// Pour PreinscriptionsController
export interface CreatePreinscriptionData {
  name: string;
  email: string;
  shop_name?: string | null;
  chosen_tier: PreinscriptionTier;
  contribution_amount: number;
  display_info: boolean;
  payment_method: PreinscriptionPaymentMethod;
  transaction_details?: Record<string, any> | null;
  // user_id?: string | null; // Si tu envoies cela depuis le client
}

export interface ValidatePreinscriptionPaymentData {
  status: Exclude<PreinscriptionPaymentStatus, 'pending'>;
  admin_notes?: string | null;
}

export interface GetPreinscriptionsParams {
  page?: number;
  limit?: number;
  payment_status?: PreinscriptionPaymentStatus;
  chosen_tier?: PreinscriptionTier;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  search?: string; // Pour nom, email, shop_name
}

// Pour ContactMessagesController
export interface CreateContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  // consent?: boolean; // Si tu l'ajoutes
}

export interface UpdateContactMessageStatusData {
  status: Exclude<ContactMessageStatus, 'new'>;
}

export interface GetContactMessagesParams {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

// --- Classe Principale SublymusServerApi ---
type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: HeadersInit;
    body?: any;
    params?: Record<string, any>;
    isFormData?: boolean;
};

export class SublymusServerApi {
    private serverUrl: string;
    private getAuthTokenServer: () => string | null;
    private t: (key: string, params?: any) => string;
    private handleUnauthorized: ((action: 'server', token?: string) => void) | undefined;

    // Namespaces
    public admin: AdminControlsNamespace;
    public apis: ServerApisNamespace; // Définitions d'API
    public auth: ServerAuthNamespace;
    public stores: ServerStoresNamespace;
    public themes: ServerThemesNamespace;
    public users: ServerUsersNamespace;
    public tryService: TryServiceNamespace;
 public preinscriptions: PreinscriptionsNamespace;
  public contactMessages: ContactMessagesNamespace;

    constructor({
        serverUrl,
        getAuthTokenServer,
        t,
        handleUnauthorized
    }: {
        serverUrl: string;
        getAuthTokenServer: () => string | null;
        t: (key: string, params?: any) => string;
        handleUnauthorized?: (action: 'server', token?: string) => void;
    }) {
        if (!serverUrl) throw new Error("SublymusServerApi: serverUrl is required.");
        this.serverUrl = serverUrl.replace(/\/$/, '');
        this.getAuthTokenServer = getAuthTokenServer;
        this.t = t;
        this.handleUnauthorized = handleUnauthorized;

        // Initialiser les namespaces
        this.admin = new AdminControlsNamespace(this);
        this.apis = new ServerApisNamespace(this);
        this.auth = new ServerAuthNamespace(this);
        this.stores = new ServerStoresNamespace(this);
        this.themes = new ServerThemesNamespace(this);
        this.users = new ServerUsersNamespace(this);
        this.tryService = new TryServiceNamespace(this);
        this.preinscriptions = new PreinscriptionsNamespace(this);
    this.contactMessages = new ContactMessagesNamespace(this);
    }

    // Méthode _request (adaptée pour toujours utiliser serverUrl)
    public async _request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const token = this.getAuthTokenServer();
        let url = `${this.serverUrl}${endpoint}`;

        const { method = 'GET', headers = {}, body = null, params = null, isFormData = false } = options;
        const requestHeaders = new Headers(headers);

        if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
        if (!isFormData && body) requestHeaders.set('Content-Type', 'application/json');
        requestHeaders.set('Accept', 'application/json');

        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) value.forEach(v => searchParams.append(key, String(v)));
                    else searchParams.set(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) url += `?${queryString}`;
        }

        const requestBody = body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : null;
        // console.log(`Server API Request: ${method} ${url}`, requestBody);

        try {
            const response = await fetch(url, { method, headers: requestHeaders, body: requestBody });
            if (response.status === 204) return null as T;

            let responseBody: any = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                try { responseBody = await response.json(); }
                catch (jsonError) {
                    if (response.ok) throw new ServerApiError(this.t('api.parseError'), response.status);
                }
            } else {
                try { responseBody = await response.text(); } catch { /* ignore */ }
            }

            if (!response.ok) {
                const errorMessage = responseBody?.message || this.t(`api.httpError.${response.status}`, { defaultValue: response.statusText });
                throw new ServerApiError(errorMessage, response.status, responseBody);
            }
            return responseBody as T;
        } catch (error) {
            if (error instanceof ServerApiError && error.status === 401) {
                this.handleUnauthorized?.('server', token ?? undefined);
                return Promise.reject(error);
            }
            if (error instanceof ServerApiError) throw error;
            if (error instanceof Error) {
                throw new ServerApiError(this.t('api.networkError'), 0, { originalError: error.message });
            }
            throw new ServerApiError(this.t('api.unknownError'), 0);
        }
    }

    // Méthode _buildFormData (identique à SublymusApi)
    public async _buildFormData({ data, files, dataFilesFelds = [], distinct }: { distinct?: boolean, dataFilesFelds?: string[], files?: Record<string, (string | Blob | File)[]>, data: Record<string, any> }) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
            if (dataFilesFelds.includes(key)) {
                if (Array.isArray(value)) {
                    const _distinct = Math.random().toString(32).replaceAll('.', '')
                    let i = 0
                    const l: string[] = []
                    for (const v of value) {
                        const d = distinct ? `${_distinct}:${key}_${i++}` : `${key}_${i++}`;
                        l.push(d);
                        (v ?? undefined) !== undefined && formData.append(d, v as Blob); // Cast to Blob
                    }
                    formData.append(key, JSON.stringify(l));
                } else {
                    console.warn(`Le champ "${key}" dans dataFilesFelds doit être un tableau.`);
                }
            } else if (Array.isArray(value)) {
                if(value.length === 0){
                    formData.append(key, JSON.stringify(value));
                } else {
                    for (const v of value) {
                        (v ?? undefined) !== undefined && formData.append(key, v);
                    }
                }
            } else {
                (value ?? undefined) !== undefined && formData.append(key, value);
            }
        }

        if (files) {
            for (const [key, fileList] of Object.entries(files)) {
                if (Array.isArray(fileList)) {
                    const _distinct = Math.random().toString(32).replaceAll('.', '')
                    let i = 0
                    const l: string[] = []
                    for (const file of fileList) {
                         if ((file ?? undefined) !== undefined) {
                            const d = distinct ? `${_distinct}:${key}_${i++}` : `${key}_${i++}`;
                            l.push(d);
                            formData.append(d, file as Blob); // Cast to Blob
                         }
                    }
                    if (l.length > 0 || data[key] === undefined) { // Append key only if files or if key not in data
                        formData.append(key, JSON.stringify(l));
                    } else if (l.length === 0 && data[key] !== undefined && Array.isArray(data[key])) {
                        // If no files but key exists in data as array (e.g. pseudo URLs from update)
                        // ensure it's stringified if it wasn't handled by dataFilesFelds
                        if (!dataFilesFelds.includes(key)) {
                             formData.set(key, JSON.stringify(data[key])); // Use set to override if key was added as single item
                        }
                    }
                }
            }
        }
        return formData;
    }
}

class PreinscriptionsNamespace {
  private _api: SublymusServerApi;
  constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

  create(data: CreatePreinscriptionData): Promise<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>> {
    return this._api._request(`/preinscriptions`, { method: 'POST', body: data });
  }

  getSummary(): Promise<ServerApiSuccessResponse<PreinscriptionSummaryInterface, 'data'>> { // Le serveur retourne directement l'objet summary
    return this._api._request(`/preinscriptions/summary`, { method: 'GET' });
  }

  validatePayment(id: string, data: ValidatePreinscriptionPaymentData): Promise<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>> {
    return this._api._request(`/admin/preinscriptions/${id}/validate-payment`, { method: 'PUT', body: data });
  }

  // Méthodes admin (supposant qu'elles retournent ListType<PreinscriptionInterface> ou PreinscriptionInterface)
  getList(params: GetPreinscriptionsParams = {}): Promise<ListType<PreinscriptionInterface>> {
    return this._api._request(`/admin/preinscriptions`, { method: 'GET', params });
  }

  getOne(id: string): Promise<PreinscriptionInterface | null> {
    return this._api._request(`/admin/preinscriptions/${id}`, { method: 'GET' });
  }

  // L'update admin pourrait avoir son propre type de données si différent de CreatePreinscriptionData
  update(id: string, data: Partial<Pick<PreinscriptionInterface, 'name' | 'email' | 'shop_name' | 'display_info' | 'admin_notes'>>): Promise<ServerApiSuccessResponse<PreinscriptionInterface, 'data'>> {
    return this._api._request(`/admin/preinscriptions/${id}`, { method: 'PUT', body: data });
  }

  delete(id: string): Promise<void> { // Souvent 204 No Content
    return this._api._request(`/admin/preinscriptions/${id}`, { method: 'DELETE' });
  }
}

class ContactMessagesNamespace {
  private _api: SublymusServerApi;
  constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

  create(data: CreateContactMessageData): Promise<ServerApiSuccessResponse<{id: string}, 'data'>> { // Le serveur retourne { message, data: {id} }
    return this._api._request(`/contact`, { method: 'POST', body: data });
  }

  // Méthodes admin
  getList(params: GetContactMessagesParams = {}): Promise<ListType<ContactMessageInterface>> {
    return this._api._request(`/admin/contact-messages`, { method: 'GET', params });
  }

  getOne(id: string): Promise<ContactMessageInterface | null> {
    return this._api._request(`/admin/contact-messages/${id}`, { method: 'GET' });
  }

  updateStatus(id: string, data: UpdateContactMessageStatusData): Promise<ServerApiSuccessResponse<ContactMessageInterface, 'data'>> {
    // Le serveur s'attend à 'status' dans le body pour PUT /admin/contact-messages/:id/status
    // Mais la route dans ton exemple est PUT /admin/contact-messages/:id/status
    // Si le payload est juste { status: 'read' }, alors c'est bon.
    return this._api._request(`/admin/contact-messages/${id}/status`, { method: 'PUT', body: data });
  }

  delete(id: string): Promise<void> {
    return this._api._request(`/admin/contact-messages/${id}`, { method: 'DELETE' });
  }
}

// --- Namespaces ---

class AdminControlsNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    pingStoreApi(storeId: string): Promise<MessageResponse> {
        return this._api._request(`/admin/stores/${storeId}/ping`, { method: 'POST' });
    }

    // admin_logout_all_devices est dans UsersController maintenant
    // async logoutAllDevicesForUser(userId: string): Promise<MessageResponse> {
    //     return this._api._request(`/admin/auth/logout-all-devices`, { method: 'POST', params: { user_id: userId } });
    // }

    getGlobalStatus(): Promise<AdminGlobalStatusResponse> {
        return this._api._request(`/admin/global_status`, { method: 'GET' });
    }

    restartAllServices(): Promise<AdminRestartServicesResponse> {
        return this._api._request(`/admin/restart_all_services`, { method: 'POST' });
    }

    refreshNginxConfigs(): Promise<MessageResponse> {
        return this._api._request(`/admin/refresh_nginx_configs`, { method: 'POST' });
    }

    /**
     * Attention: Le contrôleur GET /admin/garbage_collect_dirs a été utilisé, mais la route est POST
     * La logique serveur suggère GET pour lister. J'utilise GET.
     */
    listGarbageCollectDirs(): Promise<AdminGarbageCollectDirsResponse> {
        return this._api._request(`/admin/garbage_collect_dirs`, { method: 'GET' });
    }

    deleteGarbageDirs(params: AdminDeleteGarbageDirsParams): Promise<AdminDeleteGarbageDirsResponse> {
        return this._api._request(`/admin/garbage_collect/dirs`, { method: 'DELETE', body: params });
    }
     getAllUsers(queryParams: GetAllServerUsersParams = {}): Promise<{users: ListType<UserInterface>}> {
        return this._api._request(`/admin/users`, { method: 'GET', params: queryParams });
    }
}

class ServerApisNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    create(data: CreateServerApiDefinitionData): Promise<ServerApiDefinitionInterface> {
        return this._api._request(`/apis`, { method: 'POST', body: data });
    }

    update(apiId: string, data: UpdateServerApiDefinitionData): Promise<ServerApiDefinitionInterface> {
        return this._api._request(`/apis/${apiId}`, { method: 'PUT', body: data });
    }

    getList(params: GetServerApiDefinitionsParams = {}): Promise<ListType<ServerApiDefinitionInterface>> {
        return this._api._request(`/apis`, { method: 'GET', params });
    }

    getOne(apiId: string): Promise<ServerApiDefinitionInterface | null> {
        return this._api._request(`/apis/${apiId}`, { method: 'GET' });
    }

    delete(apiId: string): Promise<void> {
        return this._api._request(`/apis/${apiId}`, { method: 'DELETE' });
    }
}

class ServerAuthNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    register(params: ServerRegisterParams): Promise<ServerRegisterResponse> {
        return this._api._request(`/auth/register`, { method: 'POST', body: params });
    }

    login(params: ServerLoginParams): Promise<ServerLoginResponse> {
        return this._api._request(`/auth/login`, { method: 'POST', body: params });
    }

    logout(): Promise<MessageResponse> {
        return this._api._request(`/auth/logout`, { method: 'POST' });
    }

    getMe(): Promise<ServerMeResponse> {
        return this._api._request(`/auth/me`, { method: 'GET' });
    }

    /**
     * Construit l'URL de redirection vers Google. Le client devra naviguer vers cette URL.
     */
    getGoogleRedirectUrl(params: ServerGoogleRedirectParams): string {
        const queryString = new URLSearchParams(params as any).toString();
        // Accéder à serverUrl de l'instance _api
        return `${(this._api as any).serverUrl}/auth/google/redirect?${queryString}`;
    }
    // googleCallback n'est pas appelé par le client directement.
}

class ServerStoresNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    async create(data: CreateServerStoreData): Promise<StoreInterface> {
        const formData = await this._api._buildFormData({
            data,
            files: { // FormData attend des File[] même pour un seul fichier.
                ...(data.logo && { logo: [data.logo] }),
                ...(data.cover_image && { cover_image: [data.cover_image] }),
                ...(data.favicon && { favicon: [data.favicon] }),
            },
            dataFilesFelds: ['logo', 'cover_image', 'favicon']
        });
        return this._api._request(`/stores`, { method: 'POST', body: formData, isFormData: true });
    }

    getList(params: GetServerStoresParams = {}): Promise<ListType<StoreInterface>> {
        return this._api._request(`/stores`, { method: 'GET', params });
    }

    getOne(storeId: string): Promise<StoreInterface | null> {
        return this._api._request(`/stores/${storeId}`, { method: 'GET' });
    }

    async update(storeId: string, data: UpdateServerStoreData): Promise<StoreInterface> {
        const formData = await this._api._buildFormData({
             data,
             dataFilesFelds: ['logo', 'cover_image', 'favicon']
        });
        return this._api._request(`/stores/${storeId}`, { method: 'PUT', body: formData, isFormData: true });
    }

    delete(storeId: string): Promise<void> {
        return this._api._request(`/stores/${storeId}`, { method: 'DELETE' });
    }

    changeTheme(storeId: string, themeId: string | null): Promise<StoreInterface> {
        return this._api._request(`/stores/${storeId}/change_theme`, { method: 'POST', body: { theme_id: themeId } });
    }

    changeApi(storeId: string, apiId: string): Promise<StoreInterface> {
        return this._api._request(`/stores/${storeId}/change_api`, { method: 'POST', body: { api_id: apiId } });
    }

    updateStatus(storeId: string, isActive: boolean): Promise<ServerStoreActionResponse> {
        return this._api._request(`/stores/${storeId}/status`, { method: 'POST', body: { is_active: isActive } });
    }

    scale(storeId: string, replicas: number): Promise<ServerStoreActionResponse> {
        return this._api._request(`/stores/${storeId}/scale`, { method: 'POST', body: { replicas } });
    }

    stop(storeId: string): Promise<ServerStoreActionResponse> {
        return this._api._request(`/stores/${storeId}/stop`, { method: 'POST' });
    }

    start(storeId: string): Promise<ServerStoreActionResponse> {
        return this._api._request(`/stores/${storeId}/start`, { method: 'POST' });
    }

    restart(storeId: string): Promise<ServerStoreActionResponse> {
        return this._api._request(`/stores/${storeId}/restart`, { method: 'POST' });
    }

    addDomain(storeId: string, domainName: string): Promise<StoreInterface> {
        return this._api._request(`/stores/${storeId}/domains`, { method: 'POST', body: { domain_name: domainName } });
    }

    removeDomain(storeId: string, domainName: string): Promise<StoreInterface> {
        // Le contrôleur s'attend à domain_name dans le body pour DELETE aussi, basé sur validateUsing.
        return this._api._request(`/stores/${storeId}/domains`, { method: 'DELETE', body: { domain_name: domainName } });
    }

    checkAvailableName(name: string): Promise<{ is_available_name: boolean }> {
        return this._api._request(`/stores/utils/available_name`, { method: 'GET', params: { name } });
    }
}

class ServerThemesNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    async create(data: CreateServerThemeData): Promise<ThemeInterface> {
        const formData = await this._api._buildFormData({
            data,
            dataFilesFelds: ['preview_images']
         });
        return this._api._request(`/themes`, { method: 'POST', body: formData, isFormData: true });
    }

    async update(themeId: string, data: UpdateServerThemeData): Promise<ThemeInterface> {
        const formData = await this._api._buildFormData({
            data,
            dataFilesFelds: ['preview_images']
        });
        return this._api._request(`/themes/${themeId}`, { method: 'PUT', body: formData, isFormData: true });
    }

    getList(params: GetServerThemesParams = {}): Promise<ListType<ThemeInterface>> {
        return this._api._request(`/themes`, { method: 'GET', params });
    }

    getOne(themeId: string): Promise<ThemeInterface | null> {
        return this._api._request(`/themes/${themeId}`, { method: 'GET' });
    }

    delete(themeId: string, force: boolean = false): Promise<void> {
        return this._api._request(`/themes/${themeId}`, { method: 'DELETE', params: { force } });
    }

    updateVersion(themeId: string, dockerImageTag: string): Promise<ThemeInterface> {
        // La route est POST /:id/version, mais le contrôleur attend 'docker_image_tag' dans le body.
        // Le validateur s'appelle updateTagValidator et cible 'docker_image_tag'.
        // Le contrôleur ThemesController.update_theme_version utilise `POST /themes/:id/version`.
        return this._api._request(`/themes/${themeId}/version`, { method: 'POST', body: { docker_image_tag: dockerImageTag } });
    }
    
    setDefault(themeId: string): Promise<ThemeInterface> {
        return this._api._request(`/themes/${themeId}/default`, { method: 'POST' });
    }

    updateStatus(themeId: string, isActive: boolean): Promise<ThemeInterface> {
        return this._api._request(`/themes/${themeId}/status`, { method: 'POST', body: { is_active: isActive } });
    }

    start(themeId: string): Promise<MessageResponse> {
        return this._api._request(`/themes/${themeId}/start`, { method: 'POST' });
    }

    stop(themeId: string): Promise<MessageResponse> {
        return this._api._request(`/themes/${themeId}/stop`, { method: 'POST' });
    }

    restart(themeId: string): Promise<MessageResponse> {
        return this._api._request(`/themes/${themeId}/restart`, { method: 'POST' });
    }
}

class ServerUsersNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    updateMe(data: UpdateServerUserProfileData): Promise<{ user: UserInterface }> {
        // Gérer FormData si photos sont uploadées ici
        return this._api._request(`/auth/me`, { method: 'PUT', body: data });
    }

    updateMyPassword(data: UpdateServerUserPasswordData): Promise<MessageResponse> {
        return this._api._request(`/auth/me/password`, { method: 'PUT', body: data });
    }

    deleteMe(): Promise<void> {
        return this._api._request(`/auth/me`, { method: 'DELETE' });
    }

    logoutAllDevices(): Promise<MessageResponse> {
        return this._api._request(`/auth/logout-all`, { method: 'POST' });
    }
    // getAllUsers est maintenant dans AdminControlsNamespace car la route est /admin/users
}

class TryServiceNamespace {
    private _api: SublymusServerApi;
    constructor(apiInstance: SublymusServerApi) { this._api = apiInstance; }

    testEmail(recipientEmail: string): Promise<MessageResponse> {
        return this._api._request(`/try-service/email`, { method: 'GET', params: { to: recipientEmail } });
    }
}