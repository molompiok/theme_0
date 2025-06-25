// themes/mono/components/UI/Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react'; // Pour l'icône de chargement
import { useThemeSettingsStore } from '../../api/themeSettingsStore'; // Pour les couleurs du thème

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children?: ReactNode;
    asChild?: boolean; // Si true, rend le children au lieu d'un <button>
    // Permettre de passer des styles directement pour surcharger les couleurs du thème si besoin
    style?: React.CSSProperties & { '--btn-primary-bg'?: string; '--btn-primary-text'?: string; /* etc. */ };
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    asChild = false,
    style: propStyle,
    ...props
}) => {
    const generalSettings = useThemeSettingsStore(state => state.general);
    const isDarkMode = generalSettings?.darkMode?.enabled;

    // Couleurs du thème
    const themePrimaryBg = isDarkMode ? generalSettings?.darkMode?.primaryColor : generalSettings?.primaryColor;
    const themePrimaryText = isDarkMode ? generalSettings?.darkMode?.textColor : '#FFFFFF'; // Assumant texte blanc sur fond primaire
    const themeSecondaryBg = isDarkMode ? generalSettings?.darkMode?.secondaryColor : generalSettings?.secondaryColor;
    const themeSecondaryText = isDarkMode ? generalSettings?.darkMode?.textColor : generalSettings?.textColor;
    const themeBorderRadius = generalSettings?.borderRadius || '0.375rem'; // md

    // Définition des styles de base
    const baseStyles = `inline-flex items-center justify-center font-medium border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed`;

    // Styles par variante
    const variantStyles = {
        primary: `bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-transparent hover:opacity-90 focus:ring-[var(--btn-primary-focus-ring)]`,
        secondary: `bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border-transparent hover:opacity-90 focus:ring-[var(--btn-secondary-focus-ring)]`,
        outline: `bg-transparent border-current text-[var(--btn-outline-text)] hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-[var(--btn-outline-focus-ring)]`,
        ghost: `bg-transparent border-transparent text-[var(--btn-ghost-text)] hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-[var(--btn-ghost-focus-ring)]`,
        danger: `bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500`,
        link: `bg-transparent border-transparent text-[var(--btn-link-text)] hover:underline focus:ring-[var(--btn-link-focus-ring)] p-0`, // Pas de padding par défaut pour link
    };

    // Styles par taille
    const sizeStyles = {
        sm: `px-3 py-1.5 text-xs rounded-md`,
        md: `px-4 py-2 text-sm rounded-md`,
        lg: `px-6 py-3 text-base rounded-lg`,
        icon: `p-2 rounded-full`, // Pour les boutons icône uniquement
    };

    // Application du border-radius du thème
    const roundedClass = size === 'icon' ? 'rounded-full' : `rounded-[${themeBorderRadius}]`;


    // Logique pour définir les variables CSS basées sur le thème ou les props
    const cssVariables = {
        '--btn-primary-bg': themePrimaryBg || '#3B82F6',
        '--btn-primary-text': themePrimaryText || '#FFFFFF',
        '--btn-primary-focus-ring': themePrimaryBg || '#3B82F6',

        '--btn-secondary-bg': themeSecondaryBg || '#6B7280',
        '--btn-secondary-text': themeSecondaryText || '#FFFFFF',
        '--btn-secondary-focus-ring': themeSecondaryBg || '#6B7280',

        '--btn-outline-text': themePrimaryBg || '#3B82F6',
        '--btn-outline-focus-ring': themePrimaryBg || '#3B82F6',

        '--btn-ghost-text': generalSettings?.textColor || '#374151',
        '--btn-ghost-focus-ring': generalSettings?.primaryColor || '#3B82F6',

        '--btn-link-text': themePrimaryBg || '#3B82F6',
        '--btn-link-focus-ring': themePrimaryBg || '#3B82F6',

        ...propStyle // Permet de surcharger via la prop style
    } as React.CSSProperties;


    const Tag = asChild && React.isValidElement(children) ? React.Fragment : 'button';

    const buttonContent = (
        <>
            {isLoading && <Loader2 className={`animate-spin ${children ? 'mr-2' : ''} h-4 w-4`} />}
            {leftIcon && !isLoading && <span className={children ? 'mr-2' : ''}>{leftIcon}</span>}
            {children}
            {rightIcon && !isLoading && <span className={children ? 'ml-2' : ''}>{rightIcon}</span>}
        </>
    );

    if (asChild && React.isValidElement(children)) {
        // Si asChild est vrai et children est un élément React valide, clone-le avec les nouvelles props
        return React.cloneElement(children, {
            //@ts-ignore
            className: `${baseStyles} ${variantStyles[variant]} ${size === 'icon' ? sizeStyles.icon : sizeStyles[size]} ${roundedClass} ${className} ${isLoading ? 'cursor-wait' : ''}`,
            disabled: disabled || isLoading,
            style: cssVariables,
            ...props,
            // Le contenu (children original) est déjà dans l'élément cloné
        }, buttonContent); // Si on veut que le contenu du bouton soit aussi injecté
    }


    return (
        <button
            type="button" // Défaut à button pour éviter submit de formulaire
            className={`${baseStyles} ${variantStyles[variant]} ${size === 'icon' ? sizeStyles.icon : sizeStyles[size]} ${roundedClass} ${className} ${isLoading ? 'cursor-wait' : ''}`}
            disabled={disabled || isLoading}
            style={cssVariables}
            {...props}
        >
            {buttonContent}
        </button>
    );
};