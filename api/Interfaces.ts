// src/Interfaces/Interfaces.ts (ou un nom de fichier similaire)

// --- Type Utilitaire pour Listes Paginées ---
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

// --- Interface pour Utilisateur ---
export interface UserAddressInterface { // Dépendance de UserInterface
  id: string;
  user_id: string;
  name: string;
  longitude: number;
  latitude: number;
  created_at: string;
  updated_at: string;
}

export interface UserPhoneInterface { // Dépendance de UserInterface
  id: string;
  user_id: string;
  phone_number: string;
  format: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role { // Dépendance de UserInterface
  id: string,
  name: string; // Ajouté pour être utile, typiquement un rôle a un nom
  // ... autres propriétés du rôle si besoin
}

interface UserStats { // Dépendance de UserInterface
  avgRating?: number,
  commentsCount?: number,
  productsBought?: number,
  totalSpent?: number,
  ordersCount?: number,
  lastVisit?: string | null
}

export interface UserInterface {
  id: string,
  full_name: string,
  email: string,
  user_phones?: UserPhoneInterface[], // Renommé pour cohérence (était phone_numbers dans GetMeResponse de SublymusApi)
  user_addresses?: UserAddressInterface[] // Renommé pour cohérence (était addresses dans GetMeResponse de SublymusApi)
  password?: string, // Souvent omis dans les réponses API
  photo?: (string | Blob)[] | null,
  locale: string
  roles?: Role[], // Utilise l'interface Role définie
  token?: string; // Souvent présent seulement dans la réponse de login/register
  created_at: string,
  status: 'BANNED' | 'PREMIUM' | 'NEW' | 'CLIENT' | 'VISIBLE' | string; // Ajout de 'VISIBLE' vu dans AuthController, string pour flexibilité
  s_type?: string; // Semble spécifique à un contexte, garder si utile
  stats?: UserStats
  phone?: string | null; // Ajouté basé sur UsersController.updateMe
}

// --- Interface pour Store ---
// Dépendances de StoreInterface (ApiInterface et ThemeInterface sont définies ci-dessous)
export interface ApiInterface { // Doit être défini si utilisé, même vide pour l'instant
  id: string;
  name: string;
  // ... autres propriétés d'une définition d'API
}

export interface ThemeInterface { // Définition complète ci-dessous
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_images: string[] | null; // Devrait être string[] côté serveur après traitement des uploads
  features: string[] | null;
  docker_image_name: string;
  docker_image_tag: string;
  internal_port: number;
  source_path: string | null;
  is_public: boolean;
  is_active: boolean;
  is_default: boolean;
  is_premium: boolean;
  price: number;
  creator_id: string | null; // Si applicable
  created_at: string; // Changé de createdAt pour cohérence
  updated_at: string; // Changé de updatedAt pour cohérence
  fullImageName?: string; // Getter virtuel, peut être omis ou calculé côté client
  is_running?: boolean; // Ajouté basé sur le modèle Store et AdminGlobalStatus
}


export type StoreInterface = Partial<{ // Rendu Partial pour flexibilité, mais les champs clés devraient être non-optionnels si possible
  id: string;
  user_id: string;
  name: string; // Ceci est le slug-like
  title?: string;
  description?: string;
  slug: string; // Typiquement généré à partir de 'name' ou 'title'
  logo: (string | Blob)[]; // Côté client peut être Blob, côté serveur sera string[] (URLs)
  favicon: (string | Blob)[];
  cover_image: (string | Blob)[];
  domain_names?: string[];
  current_theme_id: string | null; // Peut être null si aucun thème n'est défini
  current_api_id: string;
  expire_at: string | null; // Date ISO string ou null
  disk_storage_limit_gb: number;
  is_active: boolean;
  is_running?: boolean; // Statut Swarm, souvent non stocké directement mais déduit
  created_at: string;
  updated_at: string;
  url?: string; // URL principale du store, souvent déduite
  timezone?: string,
  currency?: string,
  currentApi?: ApiInterface;
  currentTheme?: ThemeInterface;
  // Ajout basé sur StoreService et le modèle Store (s'ils existent et sont pertinents pour le client)
  // plan_id?: string;
  // custom_css?: string;
  // custom_js?: string;
  // settings?: Record<string, any>; // Pour les paramètres de thème, etc.
}>;


// --- Interface pour Preinscription ---
export type PreinscriptionPaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type PreinscriptionTier = 'bronze' | 'silver' | 'gold' | 'custom';
export type PreinscriptionPaymentMethod = 'mtn' | 'orange' | 'moov' | 'wave' | 'visa' | 'other';

export interface PreinscriptionInterface {
  id: string;
  user_id?: string | null; // Sera null si non lié à un utilisateur s_server
  name: string;
  email: string;
  shop_name?: string | null;
  chosen_tier: PreinscriptionTier;
  contribution_amount: number;
  display_info: boolean;
  payment_method: PreinscriptionPaymentMethod;
  transaction_details?: Record<string, any> | null;
  payment_status: PreinscriptionPaymentStatus;
  admin_notes?: string | null;
  created_at: string; // Date ISO string
  updated_at: string; // Date ISO string
  // user?: UserInterface; // Si tu précharges la relation côté serveur et l'envoies
}

// --- Interface pour le résumé des préinscriptions ---
export interface PreinscriptionSummaryInterface {
  total_collected: number;
  founders: {
    message?: string;
    avatar_url?: string;
    date: string
    id: string;
    name: string;
    contribution_amount: number;
    shop_name?: string | null;
    chosen_tier: PreinscriptionTier;
    created_at: string;
  }[]; // Ajout des champs pour FounderCard
}


// --- Interface pour ContactMessage ---
export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactMessageInterface {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string; // Date ISO string
  updated_at: string; // Date ISO string
}