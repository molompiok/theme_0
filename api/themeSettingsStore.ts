import { create } from "zustand";
import { combine } from "zustand/middleware";


export const DEFAULT_SETTINGS = {
    general: {
        primaryColor: "#3B82F6",       // Bleu Tailwind (blue-500)
        secondaryColor: "#6B7280",     // Gris Tailwind (gray-500)
        backgroundColor: "#FFFFFF",    // Fond de contenu blanc
        textColor: "#1F2937",         // Texte principal gris foncé (gray-800)
        bodyFont: "Inter, ui-sans-serif, system-ui, sans-serif",
        headingFont: "Poppins, ui-sans-serif, system-ui, sans-serif",
        baseFontSize: "16px",
        borderRadius: "0.5rem",        // md
        darkMode: {
            enabled: false,
            primaryColor: "#60A5FA",       // Bleu clair (blue-400)
            secondaryColor: "#9CA3AF",     // Gris (gray-400)
            backgroundColor: "#111827",    // Fond de contenu gris très foncé (gray-900)
            textColor: "#F3F4F6",         // Texte gris clair (gray-100)
        }
    },
    header: {
        show: true,
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        logoUrl: [], // Vide par défaut, l'Owner uploadera le sien
        showStoreName: true,
        navLinks: [
            { labelKey: "nav.home", href: "/" },
            // Pour le thème Mono (1-10 produits), une page "Boutique" listant tout est peut-être redondant si l'accueil le fait.
            // { labelKey: "nav.shop", href: "/products" }, 
            { labelKey: "nav.contact", href: "/contact" }, // Page contact du store
        ],
    },
    announcementBar: {
        show: false, // Désactivé par défaut
        messages: ["Livraison gratuite dès 50€ d'achat !"],
        textColor: "#FFFFFF",
        backgroundColor: "#2563EB", // Bleu plus soutenu (blue-600)
        animationSpeed: 5000,
    },
    homePage: {
        displayProductCount: 10, // Affiche jusqu'à 10 produits
        defaultCategoryIdForProducts: null,
        // Le layout par défaut sera géré par le composant si ce tableau est vide ou court
        productDisplayLayouts: [
            { imagePosition: "left", textOverlay: false },
            // { imagePosition: "right", textOverlay: false } // Pourrait alterner par défaut si alternateLayouts est true
        ],
        alternateLayouts: true, // Active l'alternance si productDisplayLayouts est plus court que le nb de produits
        fallbackLayout: { imagePosition: "left", textOverlay: false },
        showFeaturedTitleKey: "home.featuredProductsTitle", // "Nos Produits Phares"
    },
    productCard: {
        priceBeforeName:false,
        backgroundColor: "#FFFFFF",
        textColor: "#374151",      // gray-700
        priceColor: "#3B82F6",      // blue-500 (general.primaryColor)
        showRating: true,
        reductionDisplay: "barred-price",
        favoriteIconPosition: "top-right",
        addToCartButtonStyle: "icon-text",
        addToCartBackgroundColor: "#3B82F6", // blue-500
        addToCartTextColor: "#FFFFFF",
        addToCartBorderColor: "transparent",
    },
    productPage: {
        showRating: true,
        galleryLayout: "thumbnails-bottom",
        showShareButtons: true,
        relatedProductsCount: 9, // Afficher jusqu'à 9 autres produits
    },
    filterSide: { // Non utilisé par le thème Mono (pas de page catégorie/listing avec filtres)
        show: false,
        textColor: "#374151",
        backgroundColor: "#F9FAFB",
        layout: "stacked-list",
    },
    footer: {
        show: true,
        backgroundColor: "#1F2937", // gray-800
        textColor: "#9CA3AF",      // gray-400
        font: "Inter, ui-sans-serif, system-ui, sans-serif",
        layout: 'multi-column',
        sections: [
            {
                titleKey: "footer.storeNamePlaceholder", // Sera remplacé par le vrai nom du store
                contentKey: "footer.storeDescriptionPlaceholder",
                links: []
            },
            {
                titleKey: "footer.quickLinks",
                links: [
                    { labelKey: "footer.contact", href: "/contact" },
                    { labelKey: "footer.faq", href: "/store-faq" }, // FAQ générale du store
                    // { labelKey: "footer.shipping", href: "/shipping-info" } // Si pertinent
                ]
            },
            {
                titleKey: "footer.legal",
                links: [
                    { labelKey: "footer.terms", href: "/terms-and-conditions" },
                    { labelKey: "footer.privacy", href: "/privacy-policy" }
                ]
            }
        ],
        copyrightTextKey: "footer.copyright", // "© {year} {storeName}. Tous droits réservés."
        showSocialIcons: true,
        socialLinks: [ // L'Owner configurera ses propres liens
            // { platform: 'facebook', url: '#' },
            // { platform: 'instagram', url: '#' },
        ],
    },
    backgroundContainer: {
        type: "solid",
        solidColor: "#F3F4F6", // Gris très clair par défaut (gray-100)
        gradientColors: ["#A5B4FC", "#FBCFE8"],
        gradientDirection: "to-br",
        imageUrl: "",
        imageOpacity: 1,
        particles: { /* ... valeurs par défaut pour les particules ... */ },
        animationType: "none",
    },
};

export type ThemeSettings = typeof DEFAULT_SETTINGS;

// Logique du store Zustand (tu l'as déjà)
export const useThemeSettingsStore = create(
    combine(DEFAULT_SETTINGS, (set, get) => ({ // Ajouter 'get' si besoin de lire l'état dans les actions
        setSettings: (newSettings: Partial<ThemeSettings>) => {
            // Fusion profonde pour les objets imbriqués comme 'general', 'header', etc.
            set((state) => {
                const updatedState = { ...state };
                for (const key in newSettings) {
                    if (Object.prototype.hasOwnProperty.call(newSettings, key)) {
                        const sectionKey = key as keyof ThemeSettings;
                        if (typeof newSettings[sectionKey] === 'object' && newSettings[sectionKey] !== null && !Array.isArray(newSettings[sectionKey]) &&
                            typeof state[sectionKey] === 'object' && state[sectionKey] !== null && !Array.isArray(state[sectionKey])) {
                            // @ts-ignore
                            updatedState[sectionKey] = { ...state[sectionKey], ...newSettings[sectionKey] };
                        } else {
                            // @ts-ignore
                            updatedState[sectionKey] = newSettings[sectionKey];
                        }
                    }
                }
                console.log("Theme settings updated:", updatedState);
                return updatedState;
            });
        },
        // Exemple de setter spécifique que tu avais (à adapter si filterSide est sectionné)
        // setFilterSideLayout: (layout: ThemeSettings['filterSide']['layout']) => 
        //   set((state) => ({ filterSide: { ...state.filterSide, layout } })),
        resetSettings: () => set(DEFAULT_SETTINGS),
    }))
);