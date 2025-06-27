
// api/Interfaces/Interfaces.ts

export type ProductFaqData = Omit<ProductFaqInterface, 'id' | 'created_at' | 'updated_at' | 'product'>; // Pour la création

export interface ListProductFaqsParams {
  product_id: string;
  group?: string;
  page?: number;
  limit?: number;
}
export type ListProductFaqsResponse = ListType<ProductFaqInterface>;

export interface GetProductFaqParams {
  faqId: string;
}
export type GetProductFaqResponse = ProductFaqInterface | null;


// --- Types pour ProductCharacteristic ---
export type ProductCharacteristicData = Omit<ProductCharacteristicInterface, 'id' | 'created_at' | 'updated_at' | 'product'>;
export interface ListProductCharacteristicsParams {
  product_id: string;
  key?: string;
  page?: number;
  limit?: number;
}
export type ListProductCharacteristicsResponse = ListType<ProductCharacteristicInterface>;

export interface GetProductCharacteristicParams {
  characteristicId: string;
}
export type GetProductCharacteristicResponse = ProductCharacteristicInterface | null;

export type ThemeSettingsValues = Record<string, any>;

// --- Types pour Auth (Reset/Setup) ---



export interface ForgotPasswordParams {
  email: string;
  callback_url: string; // URL Frontend pour le lien de reset
}

export interface ResetPasswordParams {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface SetupAccountParams {
  token: string;
  password: string;
  password_confirmation: string;
}
export type SetupAccountResponse = MessageResponse; // Simple message de succès a priori


export type AnnimationType = {
  slidesGrid: number[];
  translate: number;
  realIndex: number;
  size: number
}
export type ListType<T> = {
  list: T[],
  meta: {
    total: number,
    per_page: number,
    current_page: number,
    last_page: number,
    first_page: number,
    first_page_url: string | null,
    last_page_url: string | null,
    next_page_url: string | null,
    previous_page_url: string | null
  }
}


export type CategorySortOptions =
  | 'name_asc'
  | 'name_desc'
  | 'created_at_desc'
  | 'created_at_asc'
  | 'product_count_desc' // Si le compte produit est disponible et triable
  | 'product_count_asc'; // Si le compte produit est disponible et triable

// Interface pour les filtres de la liste des catégories
export interface CategoryFilterType {
  // Filtres de recherche/identification
  search?: string;           // Recherche textuelle (nom, description)
  category_id?: string;      // Filtrer par un ID spécifique (pourrait être utilisé par getCategoryById mais inclus ici pour la complétude)
  slug?: string;             // Filtrer par slug spécifique
  parent_id?: string | null; // Filtrer par catégorie parente (null pour les catégories racines)

  // Filtres d'affichage
  with_product_count?: boolean; // Inclure le nombre de produits associés
  is_visible?: boolean;         // Filtrer par statut de visibilité (si applicable)

  // Tri
  order_by?: CategorySortOptions; // Option de tri

  // Pagination
  page?: number;
  limit?: number;

  // Technique (optionnel, si utilisé dans le hook useGetCategories)
  no_save?: boolean; // Pourrait indiquer de ne pas mettre à jour un store Zustand (si encore utilisé)
}



export interface CommentInterface {
  id: string
  user_id: string
  product_id: string
  order_item_id: string
  bind_name: Record<string, ValueInterface>
  order_id: string
  title: string
  description: string
  rating: number
  views: string[]
  created_at: string
  updated_at: string
  user?: UserInterface
  product?: ProductInterface
}

export interface DetailInterface {
  id: string,
  product_id: string,
  title?: string,
  description?: string,
  view?: (string | Blob)[],
  index: number
  type?: string,
  created_at: string
  updated_at: string
}


export type EventStatus = {
  change_at: string,
  status: string,
  estimated_duration?: number,
  message?: string,
  user_role: 'client' | 'admin' | 'owner' | 'collaborator' | 'supervisor',
  user_provide_change_id: string
}

export type FilterType = {
  order_by?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined;
  product_id?: string,
  list_product_ids?:string[],
  slug?: string,
  categories_id?: string[],
  slug_cat?: string,
  slug_product?: string,
  page?: number,
  with_feature?: boolean,
  limit?: number,
  is_visible?: boolean,
  no_save?: boolean,
  min_price?: number | undefined,
  max_price?: number | undefined,
  search?: string
};

export type UserFilterType = Partial<{
  // role:'client'|'collaborator'|'admin'|'team',
  with_client_role: boolean,
  with_client_stats: boolean,
  with_adresses: boolean,
  with_phones: boolean,
  user_id: string,
  order_by?: "date_desc" | "date_asc" | "full_name_desc" | "full_name_asc" | undefined,
  page: number,
  limit: number,
  no_save: boolean,
  status: string[],
  min_date: string | undefined,
  max_date: string | undefined,
  with_addresses: boolean,
  with_avg_rating: boolean,
  with_comments_count: boolean,
  with_products_bought: boolean,
  with_orders_count: boolean,
  with_total_spent: boolean,
  with_last_visit: boolean,
  search?: string
}>


export type MessageResponse = { message: string };

export interface VisiteInterface {
  user_id: string
  created_at?: string
  is_month: boolean
  is_authenticate?: boolean // si tu veux le passer temporairement côté front / debug
}

export interface UserInterface {
  id: string,
  full_name: string,
  email: string,
  user_phones?: UserPhoneInterface[],
  user_addresses?: UserAddressInterface[]
  password: string,
  photo?: (string | Blob)[] | null,
  locale: string
  token: string;
  created_at: string,
  status: 'BANNED' | 'PREMIUM' | 'NEW' | 'CLIENT'
  s_type?: string;
}

export interface UserAddressInterface {
  id: string;
  user_id: string;
  name: string;           // Label/Nom de l'adresse (ex: 'Maison', 'Bureau')
  longitude: number;
  latitude: number;
  created_at: string;     // Format ISO String
  updated_at: string;     // Format ISO String
}

export interface UserPhoneInterface {
  id: string;
  user_id: string;
  phone_number: string;   // Numéro brut (ex: '07xxxxxxxx')
  format: string | null;  // Format international suggéré (ex: '+225 07 XX XX XX XX')
  country_code: string | null; // Code pays (ex: 'ci', 'fr', 'us') ou code indicatif ('ci_225'?)
  created_at: string;     // Format ISO String
  updated_at: string;     // Format ISO String
}

export interface CommandItemInterface {
  bind: Record<string, string>
  bind_name: Record<string, ValueInterface>
  created_at: string
  currency: string
  id: string
  order_id: string
  price_unit: number
  product_id: string
  quantity: number
  status: string
  store_id: string
  updated_at: string
  product?: ProductInterface,
}
export type CommandFilterType = Partial<{
  command_id: string,
  user_id: string,
  order_by?: "date_desc" | "date_asc" | "total_price_desc" | "total_price_asc" | undefined,
  page: number,
  product_id: string,
  limit: number,
  no_save: boolean,
  status: string[],
  min_price: number | undefined,
  max_price: number | undefined,
  min_date: string | undefined,
  max_date: string | undefined,
  with_items: boolean,
  search?: string
}>
export interface CommandInterface {
  id: string,
  store_id: string,
  user_id: string,
  reference: string,
  delivery_status: string,
  payment_status: string,
  payment_method: string,
  currency: string,
  total_price: number,
  price_return_delivery: number,
  with_delivery: boolean,
  phone_number: string,
  formatted_phone_number: string,
  country_code: string,
  delivery_price: number,
  events_status: EventStatus[]
  items_count: number,

  delivery_latitude: string,
  delivery_address: string,
  delivery_address_name: string,
  delivery_longitude: string,

  pickup_address: string,
  pickup_date: string,
  pickup_address_name: string,
  delivery_date: string,

  pickup_latitude: string,
  pickup_longitude: string,

  status: string,

  items?: CommandItemInterface[]
  user?: UserInterface
  created_at: string
}

export interface CategoryInterface {
  id: string,
  name: string,
  description: string,
  parent_category_id?: string | null
  store_id: string,
  slug: string,
  product_count?: number
  view: (string | Blob)[],
  icon: (string | Blob)[],
  created_at: string,
  updated_at: string
  is_visible?: boolean
}

export interface ProductInterface {
  id: string;
  store_id: string;
  categories_id: string[];
  name: string;
  default_feature_id: string;
  slug: string,
  description: string;
  barred_price: number;
  price: number;
  rating: number,
  comment_count: number,
  stock?: number | null
  is_visible: boolean,// TODO
  currency: string;
  created_at: Date;
  updated_at: Date;
  features?: FeatureInterface[]
  categories?: CategoryInterface[]
  faqs?: ProductFaqInterface[]
  characteristics?: ProductCharacteristicInterface[]
};

// api/Interfaces/Interfaces.ts

export interface ProductCharacteristicInterface {
  id: string;
  product_id: string;
  name: string;
  icon: (string|Blob)[] | null;
  description: string | null;
  key: string | null;
  value_text: string | null;
  quantity: number | null;
  unity: string | null;
  level: number | null;
  index: number;
  created_at: string;
  updated_at: string;
  product?: ProductInterface;
}

export interface FaqSourceInterface {
  label: string;
  url: string;
}

export interface ProductFaqInterface {
  id: string;
  product_id: string;
  title: string;
  content: string;
  sources: FaqSourceInterface[] | null;
  group: string | null;
  index: number;
  created_at: string; // Ou DateTime si tu ne sérialises pas
  updated_at: string; // Ou DateTime
  product?: ProductInterface; // Optionnel si préchargé
}

export interface ValueInterface {
  id: string;
  feature_id: string;
  views?: (string | Blob)[] | null;
  icon?: (string | Blob)[] | null;
  text?: string | null;
  key?: string | null;
  stock?: number | null
  additional_price?: number | null
  decreases_stock?: boolean,
  continue_selling?: boolean
  index: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  _request_mode?: 'edited' | 'new'
};

export interface FeatureInterface {
  id: string,
  product_id: string,
  name: string,
  type: string,
  icon?: (string | Blob)[],
  required: boolean,
  regex?: string,
  min?: number,
  max?: number,
  min_size?: number,
  max_size?: number,
  index?: number,
  multiple?: false,
  is_double?: false,
  default?: string | null,
  is_default: boolean,
  created_at: string,
  updated_at: string,
  values?: ValueInterface[];
};

export interface FavoriteInteraface {
  id: string;
  user_id: string;
  label: string; // Le label/tag donné par l'utilisateur
  product_id: string;
  created_at: string; // Format ISO String
  updated_at: string; // Format ISO String
  product?: ProductInterface;
}

// --- Interface pour Inventory ---
// Basée sur le modèle Inventory.ts
export interface Inventory {
  id: string;
  address_name: string; 
  views: (string | Blob)[];       
  email: string | null;  
  latitude: number;      
  longitude: number;     
  created_at: string;    
  updated_at: string;    
  phones?: InventoryPhone[];   
  socials?: InventorySocial[]; 
}

// --- Interfaces pour les relations d'Inventory (si nécessaires) ---
export interface InventoryPhone {
  id: string;
  inventory_id: string;
  phone_number: string;
  format: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventorySocial {
  id: string;
  inventory_id: string;
  name: string;          // Nom du réseau social (ex: 'Facebook', 'Instagram')
  icon: string[] | null; // Icône (URL)
  url: string;           // URL du profil social
  created_at: string;
  updated_at: string;
}



