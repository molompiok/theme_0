// themes/mono/renderer/Layout.tsx
export { Layout };

import React, { useEffect, useMemo } from 'react';
import { PageContextProvider, usePageContext } from './usePageContext';
import type { PageContext } from 'vike/types';
import '../Lib/i18n'; // Ton i18n
import { Toaster } from 'react-hot-toast';
import { SublymusApiProvider, useGetMe } from '../api/ReactSublymusApi'; // Ton provider API
import { logoutUserGlobally, useAuthStore } from '../api/stores/AuthStore'; // Ton store Zustand pour l'auth client
import { useAppZust } from './AppStore/appZust'; // Ton store Zustand pour le mode sombre/clair global
import { useThemeSettingsStore, DEFAULT_SETTINGS, ThemeSettings } from '../api/themeSettingsStore'; // Ton store pour les settings du thème
import Header from '../Components/Layout/Header'; // Ton composant Header
import Frame from '../Components/Layout/Frame';   // Ton composant Frame
import Footer from '../Components/Layout/Footer'; // Ton composant Footer
import BackgroundContainer from '../Components/Layout/BackgroundContainer'; // Ton composant Background
import { Data } from './AppStore/Data'; // Pour stocker apiUrl et serverUrl globalement
import { useHashWatcher } from '../Hooks/useHashWatcher';
import { ClientCall } from '../Components/Utils/functions';
import { useChildViewer } from '../Components/ChildViewer/useChildViewer';

function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const { 
    themeSettingsInitial, // Vient du SSR via serveur Express et `passToClient`
    storeInfoInitial,     // Vient du SSR
    storeApiUrl,          // Vient du SSR
    serverUrl,            // Vient du SSR
  } = pageContext;

  const { getToken, logoutGlobal } = useAuthStore();
  const { initDarkMode, themeMode } = useAppZust(); // Plus besoin de setThemeMode ici si géré au niveau <html>
  const { setSettings, ...currentThemeSettings } = useThemeSettingsStore();

  
  // Initialisation des settings du thème et des URLs globales
  useEffect(() => {
    if (themeSettingsInitial) {
      setSettings(themeSettingsInitial as ThemeSettings); // Initialise le store avec les settings du SSR
    } else {
      setSettings(DEFAULT_SETTINGS); // Fallback aux défauts si rien du SSR
    }
    // Initialiser les URLs globales pour getMedia et autres
    if (storeApiUrl) Data.apiUrl = storeApiUrl;
    if (serverUrl) Data.serverUrl = serverUrl;
  }, [themeSettingsInitial, setSettings, storeApiUrl, serverUrl]);

  // Initialisation du mode sombre/clair
  useEffect(() => {
    initDarkMode(); // Applique 'dark' ou 'light' à <html> basé sur localStorage/préférence système
  }, [initDarkMode]);

  
  // Styles de base du body basés sur les settings du thème
  useEffect(() => {
    document.body.style.fontFamily = currentThemeSettings.general?.bodyFont || DEFAULT_SETTINGS.general?.bodyFont || 'sans-serif';
    document.documentElement.style.fontSize = currentThemeSettings.general?.baseFontSize || DEFAULT_SETTINGS.general?.baseFontSize || '16px';
    
    // Appliquer la classe dark/light au body en fonction du themeMode de Zustand
    // pour que les composants stylés avec `dark:` réagissent.
    // La classe sur <html> est pour Tailwind, celle sur <body> peut être pour du JS custom.
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark'; // Aide le navigateur pour les éléments de formulaire
      document.documentElement.style.backgroundColor = currentThemeSettings.general?.darkMode?.backgroundColor || DEFAULT_SETTINGS.general?.darkMode?.backgroundColor ||'';
      document.documentElement.style.color = currentThemeSettings.general?.darkMode?.textColor || DEFAULT_SETTINGS.general?.darkMode?.textColor ||'';

    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.backgroundColor = currentThemeSettings.general?.backgroundColor || DEFAULT_SETTINGS.general?.backgroundColor ||'';
      document.documentElement.style.color = currentThemeSettings.general?.textColor || DEFAULT_SETTINGS.general?.textColor ||'';
    }
  }, [currentThemeSettings.general, themeMode]);

  // Construction de l'instance SublymusApi
  // Utiliser un useMemo pour éviter de recréer l'instance à chaque render si les URLs ne changent pas.
  const apiInstanceConfig = useMemo(() => ({
    storeApiUrl: storeApiUrl || Data.apiUrl, // Priorité à ce qui vient du pageContext (SSR)
    mainServerUrl: serverUrl || Data.serverUrl,
    getAuthToken: getToken, // Token client pour l'API du store
    getAuthTokenServer: () => null, // Pas de token s_server pour le thème client
    t: (key: string) => key, // Placeholder i18n, sera remplacé par react-i18next
    handleUnauthorized: () => {
      // Pour le thème client, une déconnexion non autorisée signifie souvent un token invalide.
      // On pourrait déconnecter l'utilisateur et le laisser continuer en tant qu'invité.
      logoutGlobal() // Vider le token/user du store Zustand
      console.warn("[Theme Mono] Unauthorized API call, user logged out.");
    }
  }), [storeApiUrl, serverUrl, getToken]);


  if (!apiInstanceConfig.storeApiUrl || !apiInstanceConfig.mainServerUrl) {
      // Afficher un message ou un loader si les URLs ne sont pas encore prêtes
      // Cela peut arriver très brièvement au premier rendu client avant hydratation complète.
      console.warn("[Theme Mono Layout] API URLs not yet available from pageContext.");
      return <div>Chargement de la configuration de la boutique...</div>;
  }

  return (
    <React.StrictMode>
      <SublymusApiProvider {...apiInstanceConfig}>
        <PageContextProvider pageContext={pageContext}>
          <BackgroundContainer>
            <div className={`theme-mono-wrapper flex flex-col min-h-screen ${themeMode}`}>
              <Header/>
              <Frame>
                {children}
              </Frame>
              <Footer/>
            </div>
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{ duration: 5000 }}
            />
          </BackgroundContainer>
        <OpenChild />
        </PageContextProvider>
      </SublymusApiProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </React.StrictMode>
  );
}


// --- OpenChild Component ---
function OpenChild() {
  const { currentChild, alignItems, background, className, justifyContent, openChild } = useChildViewer();
  const hash = useHashWatcher();

  // Logique useEffect inchangée
  useEffect(() => {
    if (!currentChild && location.hash === "#openChild") {
      ClientCall(() => {
        // history.replaceState(null, "", location.pathname);
        history.back()
        openChild(null)
      });
    }
    if (location.hash !== "#openChild") {
      openChild(null)
    }
  }, [currentChild, hash]);

  // Conversion align/justify en classes Tailwind
  const flexAlignment = useMemo(() => {
    const items = alignItems === 'start' ? 'items-start' : alignItems === 'end' ? 'items-end' : 'items-center';
    const justify = justifyContent === 'left' ? 'justify-start' : justifyContent === 'right' ? 'justify-end' : justifyContent === 'space-between' ? 'justify-between' : 'justify-center';
    return `${items} ${justify}`;
  }, [alignItems, justifyContent]);


  // Rendu conditionnel Tailwind
  return (
    <div
      className={`fixed inset-0 z-[9999] flex transition-opacity duration-300 ${currentChild && hash === '#openChild' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    // Appliquer le flou via une classe dédiée si background transparent, sinon background le couvre
    // style={{ backdropFilter: blur ? `blur(${blur}px)` : 'none' }} // Appliquer backdrop-filter
    >
      {/* Fond semi-transparent */}
      <div
        className={`absolute inset-0 ${className}`}
        style={{ background: background || (className.includes('bg-') ? undefined : 'rgba(0,0,0,0.4)') }} // Défaut si non fourni
        onClick={(e) => { if (e.currentTarget === e.target) openChild(null) }} // Fermer au clic sur fond
      ></div>
      {/* Contenu centré (ou aligné selon props) */}
      {/* Ajouter `relative` pour que le contenu soit au-dessus du fond */}
      <div className={`relative w-full h-full flex ${flexAlignment}`}>
        {/* Animer l'apparition du contenu */}
        <div onClick={(e) => { if (e.currentTarget === e.target) openChild(null) }}
          className={`flex items-center justify-center transition-transform  min-w-full h-full duration-300 ease-out ${currentChild && hash === '#openChild' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {currentChild}
        </div>
      </div>
    </div>
  );
}