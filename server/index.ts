// This file isn't processed by Vite, see https://github.com/vikejs/vike/issues/562
// Consequently:
//  - When changing this file, you needed to manually restart your server for your changes to take effect.
//  - To use your environment variables defined in your .env files, you need to install dotenv, see https://vike.dev/env
//  - To use your path aliases defined in your vite.config.js, you need to tell Node.js about them, see https://vike.dev/path-aliases

// If you want Vite to process your server code then use one of these:
//  - vike-node (https://github.com/vikejs/vike-node)
//  - vavite (https://github.com/cyco130/vavite)
//     - See vavite + Vike examples at https://github.com/cyco130/vavite/tree/main/examples
//  - vite-node (https://github.com/antfu/vite-node)
//  - HatTip (https://github.com/hattipjs/hattip)
//    - You can use Bati (https://batijs.dev/) to scaffold a Vike + HatTip app. Note that Bati generates apps that use the V1 design (https://vike.dev/migration/v1-design) and Vike packages (https://vike.dev/vike-packages)

import express from 'express'
import compression from 'compression'
import { renderPage, createDevMiddleware } from 'vike/server'
import { localDir, root } from './root.js'

import { closeQueue, getServerQueue, redisClient } from "../api/Scalling/bullmqClient.js";
import { LoadMonitorService } from "../api/Scalling/loadMonitorClient.js";
import logger from "../api/Logger.js";

const SERVICE_ID = process.env.SERVICE_ID;
const isProduction = process.env.NODE_ENV === "production";

startServer()

async function startServer() {
  const app = express()

  app.use(compression())

  // Vite integration
  if (isProduction) {
    // In production, we need to serve our static assets ourselves.
    // (In dev, Vite's middleware serves our static assets.)
    const sirv = (await import('sirv')).default
    app.use(sirv(`${root}/dist/client`))
  } else {
    const { devMiddleware } = await createDevMiddleware({ root })
    app.use(devMiddleware)
  }

  
  app.get('/health', async (_req, res) => {
    res.status(200).json({ok:true});
    return
  });

  // Vike middleware. It should always be our last middleware (because it's a
  // catch-all middleware superseding any middleware placed after it).
  app.get("/res/*", async (req, res) => {
    const url = localDir + "/public" + req.originalUrl;
    console.log({ url });

    return res.sendFile(url);
  });
  app.get('*', async (req, res) => {

    const storeApiUrl = req.headers['x-store-api-url'] as string ; 
    const storeId = req.headers['x-store-id'] as string ; 
    const serverUrl = req.headers['x-server-url'] as string;
    const serverApiUrl = req.headers['x-server-api-url'] as string;
    
    if (!storeApiUrl) console.warn("[Theme Mono Server] X-Store-Api-Url header or env var not found.");
    if (!serverUrl) console.warn("[Theme Mono Server] X-Server-Url header or env var not found.");
    
    let themeSettingsInitial = {};
    let storeInfoInitial = {}; // Pour le nom du store, logo, etc.

    if (storeId && redisClient.connection && redisClient.connection.status === 'ready') {
      try {
        const settingsString = await redisClient.connection.get(`theme_settings:${storeId}:mono`); // Clé Redis pour les settings du thème Mono
        if (settingsString) {
          themeSettingsInitial = JSON.parse(settingsString);
          console.log(`[Theme Mono Server] Loaded theme settings for store ${storeId} from Redis.`);
        } else {
          console.log(`[Theme Mono Server] No theme settings found in Redis for store ${storeId}. Using defaults.`);
        }
        const storeInfoString = await redisClient.connection.get(`store+id+:${storeId}`);
        if (storeInfoString) storeInfoInitial = JSON.parse(storeInfoString);

      } catch (err) {
        console.error(`[Theme Mono Server] Error fetching theme settings from Redis for store ${storeId}:`, err);
      }
    } else if (storeId) {
      console.warn(`[Theme Mono Server] Redis not ready, cannot fetch theme settings for store ${storeId}.`);
    }

    const pageContextInit = {
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers, 
      themeSettingsInitial,    
      storeInfoInitial,          
      storeApiUrl , 
      serverUrl,  
      serverApiUrl
    }
    const pageContext = await renderPage(pageContextInit)
    if (pageContext.errorWhileRendering) {
      // Install error tracking here, see https://vike.dev/error-tracking
    }
    const { httpResponse } = pageContext
    if (res.writeEarlyHints) res.writeEarlyHints({ link: httpResponse.earlyHints.map((e) => e.earlyHintLink) })
    httpResponse.headers.forEach(([name, value]) => res.setHeader(name, value))
    res.status(httpResponse.statusCode)
    res.send(httpResponse.body)
  })

  const port = process.env.PORT || 3010
  const server = app.listen(port)
  console.log(`Server running at http://localhost:${port}`)

  const loadMonitoring = new LoadMonitorService({
    bullmqQueue: getServerQueue(),
    logger: logger,
    serviceId: SERVICE_ID || 'SERVICE-xxxid',
    serviceType: 'theme',
  });

  loadMonitoring.startMonitoring()
  const shutdown = async () => {
    console.log(`[SERVICE Server ${SERVICE_ID}] Arrêt demandé...`);
    server.close(async () => {
      console.log(`[SERVICE Server ${SERVICE_ID}] Serveur HTTP fermé.`);
      await closeQueue(); // Fermer la connexion BullMQ/Redis
      process.exit(0);
    });
    // Forcer la fermeture après un délai si le serveur ne se ferme pas
    setTimeout(async () => {
      console.error(`[SERVICE Server ${SERVICE_ID}] Arrêt forcé après timeout.`);
      await closeQueue();
      process.exit(1);
    }, 10000); // 10 secondes timeout
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  console.warn(`Server running at http://localhost:${port}`);

}