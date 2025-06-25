// api/utils/getThemeSetting.ts (ou un nom similaire)

import { useThemeSettingsStore, ThemeSettings, DEFAULT_SETTINGS } from '../themeSettingsStore'; // Ajuste le chemin

// Helper pour naviguer dans un objet avec un chemin de type string 'a.b.c'
function getPath<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue;
    }
  }
  return result !== undefined ? result : defaultValue;
}

// Type pour les chemins valides de ThemeSettings
// Cela peut devenir très complexe à générer dynamiquement pour un typage parfait.
// Pour commencer, on peut utiliser string, mais on perdra l'autocomplétion forte.
// Alternative : Utiliser des fonctions spécifiques par section.
export type ThemeSettingPath = string; // Simplifié pour l'instant

// Pour une meilleure expérience de développement, on pourrait générer les chemins possibles
// ou créer des accesseurs typés. Pour un MVP, une string est acceptable.

/**
 * Récupère une valeur de setting du thème.
 * Utilise l'état actuel du store useThemeSettingsStore.
 * Fournit une valeur par défaut si le setting n'est pas trouvé.
 *
 * @param path Le chemin vers le setting (ex: "general.primaryColor", "header.show").
 * @param fallbackValue Optionnel: une valeur à retourner si le setting est introuvable.
 *                      Si non fourni et setting introuvable, la valeur par défaut de DEFAULT_SETTINGS sera utilisée.
 * @returns La valeur du setting ou le fallback.
 */
export function getThemeSetting<T = any>(
  path: ThemeSettingPath,
  fallbackValue?: T
): T {
  // Lire l'état directement depuis le store (pas besoin d'être dans un composant React)
  const currentSettings = useThemeSettingsStore.getState();

  // 1. Essayer de récupérer la valeur depuis les settings courants
  let value = getPath<T>(currentSettings, path);

  // 2. Si non trouvée dans les settings courants, essayer depuis DEFAULT_SETTINGS
  if (value === undefined) {
    value = getPath<T>(DEFAULT_SETTINGS, path);
  }

  // 3. Si toujours non trouvée, utiliser le fallbackValue fourni
  if (value === undefined && fallbackValue !== undefined) {
    return fallbackValue;
  }
  
  // 4. Si c'est une couleur et qu'on est en mode sombre, vérifier s'il y a un override darkMode
  const pathParts = path.split('.');
  if (pathParts.length === 2 && pathParts[0] === 'general' && ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor'].includes(pathParts[1])) {
      const isDarkModeEnabled = currentSettings.general?.darkMode?.enabled ?? DEFAULT_SETTINGS.general?.darkMode?.enabled;
      if (isDarkModeEnabled) {
          const darkModeSpecificPath = `general.darkMode.${pathParts[1]}`;
          let darkModeValue = getPath<T>(currentSettings, darkModeSpecificPath);
          if (darkModeValue === undefined) {
            darkModeValue = getPath<T>(DEFAULT_SETTINGS, darkModeSpecificPath);
          }
          if (darkModeValue !== undefined) {
            value = darkModeValue;
          }
      }
  }


  // Retourner la valeur trouvée, ou une valeur par défaut générique si rien n'est trouvé.
  // Il est préférable que DEFAULT_SETTINGS soit complet pour éviter ce cas.
  return value !== undefined ? value : (fallbackValue !== undefined ? fallbackValue : undefined as any); // `undefined as any` si aucun fallback et rien trouvé
}


// Exemples d'utilisation (en dehors d'un composant React, directement dans une fonction par ex.)
// const primaryColor = getThemeSetting<string>('general.primaryColor', '#0000FF');
// const showHeader = getThemeSetting<boolean>('header.show');

// Si utilisé dans un composant React, on peut toujours utiliser le hook directement :
// const Component = () => {
//   const primaryColor = useThemeSettingsStore(state => state.general?.primaryColor || DEFAULT_SETTINGS.general.primaryColor);
//   // ...
// }