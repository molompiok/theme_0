//renderer/+onRenderHtml.tsx
// https://vike.dev/onRenderHtml
export { onRenderHtml }
import i18next from "../Lib/i18n";
import ReactDOMServer from 'react-dom/server'
import { Layout } from './Layout'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'
import logoUrl from './logo.svg'
import type { OnRenderHtmlAsync } from 'vike/types'
import { getPageTitle } from './getPageTitle'
import { I18nextProvider } from 'react-i18next';
import './tw.css'
import { DEFAULT_SETTINGS } from "../api/themeSettingsStore";
import { ThemeProvider } from "./ThemeContext";

const onRenderHtml: OnRenderHtmlAsync = async (pageContext): ReturnType<OnRenderHtmlAsync> => {
  const { Page, themeSettingsInitial, storeInfoInitial, storeApiUrl, serverUrl, lang: langFromContext } = pageContext;

  console.log({storeApiUrl, serverUrl});
  
  
  const i18n = i18next.cloneInstance();
  // Alternatively, we can use an HTML stream, see https://vike.dev/streaming
  const pageHtml = ReactDOMServer.renderToString(
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <Layout pageContext={pageContext}>
          <Page />
        </Layout>
      </I18nextProvider>
    </ThemeProvider>
  )


  const title = getPageTitle(pageContext); // getPageTitle peut utiliser storeInfoInitial?.name
  const desc = pageContext.data?.description || pageContext.config.description || storeInfoInitial?.description || 'Boutique en ligne Sublymus';
  const lang = langFromContext || 'fr'; // Utiliser la langue du contexte si définie

  // Le logo et le nom du store pour les métadonnées peuvent venir de storeInfoInitial
  const currentStoreName = storeInfoInitial?.name || 'Ma Boutique';
  const currentFavicon = storeInfoInitial?.favicon?.[0] ? `${serverUrl || ''}${storeInfoInitial.favicon[0]}` : logoUrl; // Ajuster si favicon est URL complète

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="${lang}" class="${''}">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="${currentFavicon}" />
        <meta name="description" content="${desc}" />
        <title>${title}</title>
        ${(themeSettingsInitial?.general?.bodyFont || DEFAULT_SETTINGS.general?.bodyFont || '') && escapeInject`<link href="https://fonts.googleapis.com/css2?family=${(themeSettingsInitial.general?.bodyFont || DEFAULT_SETTINGS.general?.bodyFont!).replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`}
        ${(themeSettingsInitial?.general?.headingFont || DEFAULT_SETTINGS.general?.headingFont || '') && escapeInject`<link href="https://fonts.googleapis.com/css2?family=${(themeSettingsInitial.general?.headingFont || DEFAULT_SETTINGS.general?.headingFont!).replace(' ', '+')}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`}
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {
      // lang est déjà dans pageContext grâce à onBeforeRender ou logique précédente
      // themeSettingsInitial, storeApiUrl, serverUrl sont déjà passés par le serveur Express et listés dans passToClient
    }
  };
}