// pages/themes/preview/+Page.tsx
// Page autonome chargée dans une iframe pour la preview et l'éditeur de thème

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { IoCartOutline, IoSearchOutline, IoPersonCircleOutline, IoMenu } from 'react-icons/io5';
import logoPlaceholder from './logo-placeholder.svg';
import productPlaceholder from './product-placeholder.png';
import logger from '../../api/Logger'; // Assurez-vous que ce chemin est correct

// Importer les types et la classe SublymusApi
// Ajustez le chemin si SublymusApi.ts est dans un autre dossier
import { SublymusApi, ApiError } from '../../api/SublymusApi'; // Supposons que SublymusApi.ts est 3 niveaux au-dessus
import type { CategoryInterface, ProductInterface, ListType } from '../../Interfaces/Interfaces'; // Supposons que Interfaces.ts est 3 niveaux au-dessus
import { usePageContext } from '../../renderer/usePageContext';


// --- Types ---
interface ThemeSettings {
    primaryColor?: string;
    secondaryColor?: string;
    bodyFont?: string;
    headingFont?: string;
    layoutType?: 'grid' | 'list';
    showHeader?: boolean;
    showFooter?: boolean;
    // Options de personnalisation spécifiques au store
    storeName?: string; // Nom du store, peut aussi venir de l'API
    storeLogoUrl?: string; // URL du logo du store, peut aussi venir de l'API
}

// Type pour les messages postMessage
interface PostMessageData {
    type: 'UPDATE_THEME_SETTINGS' | 'GET_CURRENT_SETTINGS' | 'INIT_PREVIEW_DATA'; // Ajouter INIT_PREVIEW_DATA
    payload?: any;
}

interface InitPreviewPayload {
    settings: Partial<ThemeSettings>;
    storeApiUrl: string | null; // URL de l'API du store spécifique
    storeId: string | null; // ID du store, pourrait être utile
    initialData?: { // Données optionnelles pré-chargées par le parent
        categories?: CategoryInterface[];
        products?: ProductInterface[];
    }
}

// --- Valeurs par Défaut ---
const DEFAULT_SETTINGS: ThemeSettings = {
    primaryColor: '#3B82F6',
    secondaryColor: '#6B7280',
    bodyFont: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    headingFont: 'Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    layoutType: 'grid',
    showHeader: true,
    showFooter: true,
    storeName: 'Nom de la boutique',
    storeLogoUrl: logoPlaceholder,
};

// --- Fonction pour parser les paramètres (simple pour S0) ---
// Peut être conservé pour des overrides initiaux si nécessaire, mais postMessage sera prioritaire
const parseThemeSettingsFromQuery = (searchParams: URLSearchParams): Partial<ThemeSettings> & { storeApiUrl?: string } => {
    const settings: Partial<ThemeSettings> & { storeApiUrl?: string } = {};
    const primaryColor = searchParams.get('setting_primaryColor');
    if (primaryColor) settings.primaryColor = `#${primaryColor}`;

    const bodyFont = searchParams.get('setting_bodyFont');
    if (bodyFont) settings.bodyFont = decodeURIComponent(bodyFont);

    // Pourrait aussi lire l'URL de l'API du store depuis query params si nécessaire
    const apiUrl = searchParams.get('storeApiUrl');
    if (apiUrl) settings.storeApiUrl = decodeURIComponent(apiUrl);

    return settings;
};

// --- Composant Page ---
export function Page() {
    const { t } = { t: (text: string) => text }; // Simple i18n placeholder
    const { urlParsed,apiUrl, serverUrl } = usePageContext();

    const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
    const [storeApiUrl, setStoreApiUrl] = useState<string>(apiUrl);
   
    const [realCategories, setRealCategories] = useState<CategoryInterface[]>([]);
    const [realProducts, setRealProducts] = useState<ProductInterface[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Instance de SublymusApi
    const api = useMemo(() => {
        if (!apiUrl) return null;
        try {
            return new SublymusApi({
                storeApiUrl: apiUrl,
                serverUrl: serverUrl, // Pas nécessaire pour les appels API store-specific
                getAuthTokenApi: () => null, // Preview publique
                getAuthTokenServer: () => null,
                t: (key:string) => key, // Simple traducteur
                handleUnauthorized: () => { logger.warn("Unauthorized access attempt in preview"); }
            });
        } catch (e) {
            logger.error("Failed to initialize SublymusApi", e);
            setError("Erreur d'initialisation de l'API.");
            return null;
        }
    }, [storeApiUrl]);


    // --- Récupération des données du store ---
    const fetchStoreData = useCallback(async () => {
        if (!api) {
            setError("L'API n'est pas initialisée. Vérifiez l'URL de l'API du store.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            logger.info(`Fetching data from ${storeApiUrl}`);
            // Fetch Categories
            const categoriesResponse = await api.categories.getList({ limit: 10 }); // Limiter pour la preview
            setRealCategories(categoriesResponse.list);
            logger.debug("Categories fetched", categoriesResponse.list);

            // Fetch Products
            const productsResponse = await api.products.getList({ limit: 8 }); // Limiter pour la preview
            setRealProducts(productsResponse.list);
            logger.debug("Products fetched", productsResponse.list);

        } catch (err:any) {
            logger.error("Failed to fetch store data", err);
            if (err instanceof ApiError) {
                setError(`Erreur API (${err.status}): ${err.message}`);
            } else {
                setError("Une erreur est survenue lors de la récupération des données du store.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [api, storeApiUrl]);


    // --- Initialisation et Écoute PostMessage ---
    useEffect(() => {
        const initialSettingsFromQuery = parseThemeSettingsFromQuery(new URLSearchParams(urlParsed.search));
        if (initialSettingsFromQuery.storeApiUrl) {
            setStoreApiUrl(initialSettingsFromQuery.storeApiUrl);
        }
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...initialSettingsFromQuery }));

        const handleMessage = (event: MessageEvent<PostMessageData>) => {
            // TODO: Vérifier event.origin pour la sécurité !
            // Exemple: if (event.origin !== 'https://dashboard.votredomaine.com') return;

            const { type, payload } = event.data;

            if (type === 'INIT_PREVIEW_DATA' && payload) {
                logger.debug("Received INIT_PREVIEW_DATA via postMessage", payload);
                const initPayload = payload as InitPreviewPayload;
                if (initPayload.settings) {
                    setSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...initPayload.settings }));
                }

            } else if (type === 'UPDATE_THEME_SETTINGS' && payload) {
                logger.debug("Received UPDATE_THEME_SETTINGS via postMessage", payload);
                setSettings(prev => ({ ...prev, ...payload }));
            } else if (type === 'GET_CURRENT_SETTINGS') {
                event.source?.postMessage({ type: 'CURRENT_SETTINGS', payload: settings }, event.origin as any);
            }
        };

        window.addEventListener('message', handleMessage);
        logger.debug("Preview page ready and listening for postMessages.");
        window.parent.postMessage({ type: 'PREVIEW_IFRAME_READY' }, '*');

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [urlParsed.search]);

    // --- Effet pour récupérer les données lorsque l'API est prête ---
    useEffect(() => {
        // Ne pas fetch si des données initiales ont été fournies et qu'elles ne sont pas vides
        // ou si storeApiUrl n'est pas encore défini
        if ((realCategories.length > 0 || realProducts.length > 0) || !storeApiUrl || !api) {
            return;
        }
        fetchStoreData();
    }, [storeApiUrl, api, fetchStoreData, realCategories.length, realProducts.length]); // Ajouter realCategories et realProducts pour éviter re-fetch si déjà peuplé par INIT

    // --- Styles dynamiques (inchangés) ---
    const bodyStyle: React.CSSProperties = useMemo(() => ({
        fontFamily: settings.bodyFont ?? DEFAULT_SETTINGS.bodyFont,
    }), [settings.bodyFont]);

    const primaryColorStyle = useMemo(() => ({
        color: settings.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    }), [settings.primaryColor]);

    const primaryBackgroundStyle = useMemo(() => ({ // Non utilisé actuellement, mais conservé
        backgroundColor: settings.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    }), [settings.primaryColor]);

    const headingStyle: React.CSSProperties = useMemo(() => ({
        fontFamily: settings.headingFont ?? DEFAULT_SETTINGS.headingFont,
    }), [settings.headingFont]);

    // Utiliser le nom du store et le logo des settings s'ils sont fournis
    const currentStoreName = settings.storeName || DEFAULT_SETTINGS.storeName;
    const currentStoreLogo = settings.storeLogoUrl || DEFAULT_SETTINGS.storeLogoUrl;

    // --- Rendu ---
    return (
        <div className="theme-preview-page font-sans antialiased" style={bodyStyle}>
            {settings.showHeader && (
                <header className="sticky top-0 z-20 bg-white shadow-sm">
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <img className="h-8 w-auto" src={currentStoreLogo} alt="Logo" />
                                <span className="font-bold text-lg text-gray-800">{currentStoreName}</span>
                            </div>
                            <div className="hidden sm:flex sm:space-x-6">
                                {(realCategories.length > 0 ? realCategories : categoriesPlaceholder).slice(0, 4).map(cat => (
                                    <a key={cat.id} href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">{cat.name}</a>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoSearchOutline size={20} /></button>
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative">
                                    <IoCartOutline size={22} />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">3</span>
                                </button>
                                <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoPersonCircleOutline size={24} /></button>
                                <button className="sm:hidden p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"><IoMenu size={24} /></button>
                            </div>
                        </div>
                    </nav>
                </header>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                {isLoading && <div className="text-center py-10">Chargement des données du store...</div>}

                {/* ... (Bannière Héro, reste identique pour l'instant) ... */}
                <div style={{ backgroundImage: `linear-gradient(to right, ${settings.secondaryColor}50, ${settings.secondaryColor}20)`, }}
                    className={` rounded-lg p-8 md:p-12 mb-8 flex items-center`}>
                    <div className='w-2/3'>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2" style={{ ...headingStyle, ...primaryColorStyle }}>{t('heroTitle')}</h1>
                        <p className="text-base md:text-lg text-gray-600">{t('heroSubtitle')}</p>
                        <button style={{ backgroundImage: `linear-gradient(to right, ${settings.primaryColor}80, ${settings.primaryColor}80)`, }} className="mt-4 px-5 py-2 rounded-md text-white font-medium shadow hover:opacity-90">{t('heroButton')}</button>
                    </div>
                </div>

                {/* Section Catégories */}
                {!isLoading && realCategories.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('categoriesTitle')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {realCategories.map(cat => (
                                <a key={cat.id} href="#" className="block group aspect-video rounded-lg overflow-hidden relative shadow hover:shadow-md transition bg-gray-200">
                                    {/* Utiliser l'image de la catégorie si disponible, sinon placeholder */}
                                    <img src={storeApiUrl+cat.view?.[0] || productPlaceholder} alt={cat.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    <span className="absolute bottom-2 left-2 text-sm font-medium text-white">{cat.name}</span>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
                {!isLoading && realCategories.length === 0 && !error && (
                    <p className="text-gray-500 mb-8">Aucune catégorie à afficher.</p>
                )}


                {/* Section Produits */}
                {!isLoading && realProducts.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4" style={headingStyle}>{t('productsTitle')}</h2>
                        <div className={`grid gap-4 ${settings.layoutType === 'list' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                            {realProducts.map(product => (
                                <a key={product.id} href="#" className={`block group rounded-lg overflow-hidden shadow border border-gray-100 ${settings.layoutType === 'list' ? 'flex gap-4 p-3 items-center' : ''}`}>
                                    <div style={{ background: `${settings.secondaryColor}10` }} className={` ${settings.layoutType === 'list' ? 'w-20 h-20 flex-shrink-0 rounded' : 'w-full aspect-square'}`}>
                                        {/* Utiliser la première image des features.values.views ou un placeholder */}
                                        <img
                                            src={storeApiUrl+ (product.features?.[0]?.values?.[0]?.views?.[0] as string) || productPlaceholder} // Adapter pour trouver la bonne image
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className={settings.layoutType === 'list' ? 'flex-grow' : 'p-3'}>
                                        <h3 className={`font-medium text-sm truncate ${settings.layoutType === 'list' ? 'text-gray-800' : 'text-gray-700'}`} style={headingStyle}>{product.name}</h3>
                                        <p className={`font-semibold mt-1 ${settings.layoutType === 'list' ? 'text-base' : 'text-sm'}`} style={primaryColorStyle}>
                                            {product.price?.toLocaleString()} {product.currency}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
                 {!isLoading && realProducts.length === 0 && !error && (
                    <p className="text-gray-500">Aucun produit à afficher.</p>
                )}

            </main>

            {/* Footer (inchangé) */}
            {settings.showFooter && (
                <footer className="bg-gray-800 text-gray-400 text-sm mt-12 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">{currentStoreName}</h4>
                            <p className="text-xs">{t('footerAbout')}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">{t('footerLinks')}</h4>
                            <ul className="space-y-1 text-xs">
                                <li><a href="#" className="hover:text-white">Accueil</a></li>
                                <li><a href="#" className="hover:text-white">Produits</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">{t('footerContact')}</h4>
                            <address className="text-xs not-italic space-y-1">
                                <p>123 Rue Sublymus</p>
                                <p>Abidjan, Côte d'Ivoire</p>
                                <p>info@maboutique.com</p>
                            </address>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-2">{t('footerSocial')}</h4>
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-700">
                        © {new Date().getFullYear()} {currentStoreName}. {t('footerRights')}
                    </div>
                </footer>
            )}
        </div>
    );
}

// Données placeholder si l'API ne retourne rien ou en attendant le chargement
const categoriesPlaceholder = [
    { id: '1', name: 'Catégorie A' }, { id: '2', name: 'Catégorie B' },
    { id: '3', name: 'Catégorie C' }, { id: '4', name: 'Catégorie D' },
];