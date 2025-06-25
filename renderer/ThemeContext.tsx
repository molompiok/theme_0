import React, { createContext, useContext, ReactNode } from 'react';
import themeConfig from '../theme.config.json'; // Importe directement le JSON

// Définir une interface pour la configuration pour avoir de l'autocomplétion
interface ThemeConfig {
    layout: {
        product_gallery_layout: string
    },
    identity: {
        product_to_feature: string;
        category_for_recommendations?: string;
    };
    palette: {
        primary: string;
        accent: string;
        text_base: string;
        text_muted: string;
        background_light: string;
        background_dark: string;
    };
    typography: {
        font_headings: string;
        font_body: string;
    };
    // ... autres sections
}

const ThemeContext = createContext<ThemeConfig | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    return (
        <ThemeContext.Provider value={themeConfig as ThemeConfig}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeConfig => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};