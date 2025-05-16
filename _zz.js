/*



Voici un **résumé complet** et clair de la solution que tu peux copier dans un fichier mémo pour t’en souvenir :

---

### ✅ **Mémo : Servir Vike SSR avec un chemin de base dynamique (`/ladonaX`)**

#### 🧩 **Contexte**

* Application Vike SSR servie derrière NGINX via Express.
* Chaque boutique est disponible sous un chemin dynamique :
  `https://mon-domaine.com/ladona2`, `.../ladona3`, etc.
* Les assets (`/assets/...`) et les liens doivent respecter ce chemin dynamique.

---

#### 🎯 **Objectif**

* Générer dynamiquement les URLs d’assets et de navigation côté serveur et client.
* Injecter un `<base href="/ladonaX/">` dans le HTML pour les liens relatifs.
* Faire en sorte que `pageContext.baseUrl` soit disponible côté client.

---

### 🚀 **Étapes de mise en œuvre**

#### 1. **Configurer le proxy NGINX**

```nginx
location ~ ^/(ladona[0-9]+)/(.*)$ {
    proxy_set_header X-Base-Url /$1/;
    proxy_pass http://localhost:3000/$2$is_args$args;
    proxy_set_header Host $host;
}
```

#### 2. **Récupérer `X-Base-Url` dans `onRenderHtml()`**

```ts
const baseUrlFromHeader = (pageContext.headers as Record<string, string>)['x-base-url'] || '/'
```

#### 3. **Injecter le `baseUrl` dans le HTML généré**

```tsx
<base href="${baseUrlFromHeader}" />
```

#### 4. **Retourner le `baseUrl` dans `pageContext`**

```ts
return {
  documentHtml,
  pageContext: {
    baseUrl: baseUrlFromHeader,
    serverUrl: serverUrlFromHeader,
    apiUrl: apiUrlFromHeader,
    lang
  }
}
```

#### 5. **Déclarer `baseUrl` dans `+config.ts`**

```ts
export default {
  passToClient: ['baseUrl', 'serverUrl', 'apiUrl', 'lang', 'pageProps']
}
```

---

### ✅ **Résultat**

* Les assets sont bien chargés depuis `/ladonaX/assets/...`
* La navigation fonctionne correctement avec `<base href="...">`
* `pageContext.baseUrl` est disponible côté client (React / hooks / etc.)
* Plus d’erreurs liées à des assets mal résolus ou des `pageContext` manquants

---

### 🧠 Astuce

* Tu peux utiliser `pageContext.baseUrl` dans les composants pour construire dynamiquement les routes (`<Link to={baseUrl + 'dashboard'}>`).

---

Tu peux coller ce mémo dans un fichier `docs/memo-vike-ssr-multibase.md` par exemple. Si tu veux aussi documenter la configuration côté client pour des helpers de navigation, je peux t’aider à compléter.





*/