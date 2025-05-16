//renderer/+onRenderClient.tsx
// https://vike.dev/onRenderClient
export { onRenderClient }
import '../Lib/i18n';
import ReactDOM from 'react-dom/client'
import { Layout } from './Layout'
import { getPageTitle } from './getPageTitle'
import type { OnRenderClientAsync } from 'vike/types'
import { I18nextProvider } from 'react-i18next';
import i18next from '../Lib/i18n';

let root: ReactDOM.Root
const onRenderClient: OnRenderClientAsync = async (pageContext): ReturnType<OnRenderClientAsync> => {
  const { Page } = pageContext

  // This onRenderClient() hook only supports SSR, see https://vike.dev/render-modes for how to modify onRenderClient()
  // to support 
  const { urlParsed ,baseUrl,apiUrl,serverUrl} = pageContext
 console.log({ urlParsed ,baseUrl,apiUrl,serverUrl});
 
  const i18n = i18next.cloneInstance();
  if (!Page) throw new Error('My onRenderClient() hook expects pageContext.Page to be defined')

  const container = document.getElementById('root')
  if (!container) throw new Error('DOM element #root not found')

  //  console.log(' pageContext.apiUrl',  pageContext.apiUrl);
  //  console.log(' pageContext.serverUrl',  pageContext.serverUrl);
   console.log(' pageContext.baseUrl',  pageContext.baseUrl);
   
  const page = (
      <I18nextProvider i18n={i18n}>
        <Layout pageContext={pageContext}>
          <Page />
        </Layout>
      </I18nextProvider>
  )
  if (pageContext.isHydration) {
    root = ReactDOM.hydrateRoot(container, page)
  } else {
    if (!root) {
      root = ReactDOM.createRoot(container)
    }
    root.render(page)
  }
  document.title = getPageTitle(pageContext)
}