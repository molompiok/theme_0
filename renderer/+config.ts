//renderer/+config.ts
import type { Config } from 'vike/types'

// https://vike.dev/config
export default {
  // https://vike.dev/clientRouting
  clientRouting: true,
  // https://vike.dev/meta
   passToClient: ['pageProps', 'baseUrl', 'lang', 'apiUrl', 'serverUrl'],
  meta: {
    // Define new setting 'title'
    title: {
      env: { server: true, client: true }
    },
    // Define new setting 'description'
    description: {
      env: { server: true }
    }
  },
  hydrationCanBeAborted: true
} satisfies Config

const Api_host = 'http://172.25.72.235:3334'
const Host = `http://localhost:3000`
const Server_Host = `http://172.25.72.235:5555`
export {Host, Server_Host,Api_host}