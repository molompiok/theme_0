// renderer/Layout.tsx
export { Layout };

import React, { useEffect, useState, useMemo } from 'react';
import { PageContextProvider, usePageContext } from './usePageContext';
import type { PageContext } from 'vike/types';
import '../Lib/i18n'; // Gardé si utilisé ailleurs, sinon à retirer si non
import { useHashWatcher } from '../Hooks/useHashWatcher';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast'; // Pour afficher les notifications toast
import { SublymusServerApiProvider } from '../api/ReactSublymusServer';
import { Server_Host } from './+config';

function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const { t } = useTranslation(); // t est déjà là
  const serverApiUrl = Server_Host; // Exemple de variable d'env

  if (!serverApiUrl) {
    console.error("VITE_SUBLYMUS_SERVER_URL is not defined in environment variables.");
    // Gérer l'erreur, peut-être afficher un message à l'utilisateur ou retourner un fallback
    return <div>Erreur de configuration serveur. Veuillez contacter le support.</div>;
  }

  // Pour la landing page, la plupart des appels serveur n'auront pas besoin de token
  const getDummyAuthToken = () => null;

  const handleServerUnauthorized = (action: 'server', token?: string) => {
    console.warn(`Unauthorized server action for s_welcome. Action: ${action}, Token used: ${!!token}`);
  };

  return (
    <React.StrictMode>
        <SublymusServerApiProvider
          serverUrl={serverApiUrl}
          getAuthToken={getDummyAuthToken}
          handleUnauthorized={handleServerUnauthorized}
        >
          <PageContextProvider pageContext={pageContext}>
            <div className="flex flex-col min-h-screen bg-white">
              <Frame>
                {children}
              </Frame>
            </div>
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{ duration: 5000 }}
            />
          </PageContextProvider>
        </SublymusServerApiProvider>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </React.StrictMode>
  );
}

// --- Composant OpenChild (Popup/Modal Global) ---
// Reste identique à ton code


// --- Composant Frame ---
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main // Changé en <main> pour la sémantique
      className="flex-grow w-full transition-filter duration-300" // flex-grow pour prendre l'espace, retiré mx-auto et max-w-7xl (sera géré par page/section)
    >
      {children}
    </main>
  );
}