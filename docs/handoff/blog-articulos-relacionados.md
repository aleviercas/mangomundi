# mangomundi — Traspaso: Artículos relacionados (interconexión del blog)

> Documento de traspaso autocontenido. Con esto, cualquier Claude nuevo puede
> implementar la funcionalidad sin necesitar la conversación original.

---

## 1. Qué se decidió y por qué

Objetivo: que los 23 artículos del blog (× 20 idiomas = 460 filas en
`blog_posts`) se muestren interconectados entre sí con una sección de
"Artículos relacionados" (4 links), sin curar cada relación a mano.

**Se evaluaron 3 niveles y se eligió el Nivel 2** (taxonomía liviana +
relacionados automáticos):

- Nivel 1 (solo `audience`, sin ninguna categoría): descartado — dentro de
  retail hay temas demasiado distintos entre sí (un corredor específico como
  Kenia no tiene nada que ver con Venezuela/Cuba solo por ser los dos retail)
- **Nivel 2 (elegido):** un campo de categoría liviana (`topic_cluster`) por
  artículo, y la consulta trae los relacionados por `audience` + `topic_cluster`.
  Es el patrón estándar de la industria — se conoce como **"pillar + cluster
  content"**, la arquitectura de contenido más citada en SEO para este
  problema exacto. Cero mantenimiento manual de relaciones: un artículo nuevo
  solo necesita que le pongan la categoría correcta al publicarlo.
- Nivel 3 (tabla de relaciones curadas a mano, 4 por artículo): descartado —
  más preciso, pero implica trabajo manual cada vez que se agrega o cambia un
  artículo (curar 4 relaciones + salir a agregarlo en 2-3 artículos existentes
  para que sea descubrible). Se reserva normalmente solo para 1-2 páginas
  pilar muy importantes de un sitio, no para todo el catálogo.

---

## 2. Implementación — paso a paso

### 2.1 Migración (aditiva, sin riesgo)

```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS topic_cluster text;
```

### 2.2 Asignar el cluster a cada uno de los 23 temas

Un `UPDATE` por slug — cada uno actualiza automáticamente las 20 filas de
idioma de ese tema, no hace falta iterar por fila.

```sql
-- Business
UPDATE blog_posts SET topic_cluster = 'provider-comparison' WHERE slug IN (
  'airwallex-payoneer-wise-business-hikaku',
  'wise-vs-revolut-business-tesouraria'
);

UPDATE blog_posts SET topic_cluster = 'supplier-payments' WHERE slug IN (
  'small-ecommerce-overseas-supplier-payments',
  'costi-nascosti-pagamenti-fornitori-esteri',
  'cach-tinh-chi-phi-thuc-te-chuyen-tien-doanh-nghiep',
  'negosiasi-kurs-fx-bank-panduan'
);

UPDATE blog_posts SET topic_cluster = 'treasury-strategy' WHERE slug IN (
  'fx-risk-management-smes-expanding-internationally',
  'zhongxiaoqiye-waihui-duichong-celue',
  'treasury-automatisierung-multi-currency-mittelstand',
  'optimizatsiya-oborotnogo-kapitala-transgranichnyh',
  'uluslararasi-buyume-cok-para-birimli-odeme-stratejisi',
  'eu-gyeoljae-gyuje-gukgyeong-bijeuniseu',
  'ai-przyszlosc-zarzadzania-ryzykiem-walutowego'
);

-- Retail
UPDATE blog_posts SET topic_cluster = 'africa' WHERE slug IN (
  'kenya-mobile-money-remittance-fees',
  'envoyer-argent-afrique-comparer-couts'
);

UPDATE blog_posts SET topic_cluster = 'asia-pacific' WHERE slug IN (
  'us-philippines-ofw-remittance-guide',
  'pagpapadala-pera-pilipinas-gastos-bilis',
  'sending-money-india-pakistan-comparison'
);

UPDATE blog_posts SET topic_cluster = 'middle-east' WHERE slug IN (
  'muqarana-khayarat-tahwil-alamwal-alsharq-alawsat'
);

UPDATE blog_posts SET topic_cluster = 'latin-america' WHERE slug IN (
  'comparar-proveedores-remesas-latinoamerica',
  'venezuela-cuba-raqam-bhejna-rehnumai'
);

UPDATE blog_posts SET topic_cluster = 'general-practical' WHERE slug IN (
  'priapthiap-app-rap-ngoen-jak-tangprathet',
  'remittance-arthik-antorvukti-probashi-shromik'
);
```

8 clusters en total. Los chicos (`middle-east` con 1 tema, `africa`/
`latin-america`/`general-practical` con 2) se completan con el fallback de
audience de la sección 2.3 — no hace falta forzarlos a tener 4 miembros cada
uno.

### 2.3 Consulta de "relacionados" (lógica de servidor)

Dos consultas, se combinan y se corta en 4. Recomiendo hacerlo en la función
de servidor (junto a donde ya vive `blog.functions.ts`), no en el frontend:

```ts
// 1. Primero, mismo audience + mismo cluster, más recientes, sin incluirse a sí mismo
const { data: sameCluster } = await supabaseAdmin
  .from("blog_posts")
  .select("slug, title, excerpt")
  .eq("locale", currentLocale)
  .eq("audience", currentAudience)
  .eq("topic_cluster", currentTopicCluster)
  .neq("slug", currentSlug)
  .order("published_at", { ascending: false })
  .limit(4);

// 2. Si faltan para llegar a 4, completar con mismo audience (cualquier cluster)
const missing = 4 - (sameCluster?.length ?? 0);
let filler: typeof sameCluster = [];
if (missing > 0) {
  const excludeSlugs = [currentSlug, ...(sameCluster?.map(p => p.slug) ?? [])];
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title, excerpt")
    .eq("locale", currentLocale)
    .eq("audience", currentAudience)
    .not("slug", "in", `(${excludeSlugs.join(",")})`)
    .order("published_at", { ascending: false })
    .limit(missing);
  filler = data ?? [];
}

const relatedPosts = [...(sameCluster ?? []), ...filler]; // máximo 4
```

### 2.4 Dónde va en la página (ya verificado contra el código real)

En `src/routes/blog_.$slug.tsx`, la estructura actual dentro de `<article>` es:

```
...contenido...
<ReactMarkdown>{content_md}</ReactMarkdown>
<SponsoredProvidersSection audience={post.audience} />
```

`RelatedArticlesSection` va **después** de `SponsoredProvidersSection`, como
última pieza antes de cerrar `</article>`. No antes: justo al terminar de
leer es el momento de mayor intención, y ahí primero tiene que aparecer el
link al proveedor (la conversión), no la tentación de irse a leer otra cosa.
"Relacionados" queda como red de contención para el que no hizo clic.

```
...contenido...
<SponsoredProvidersSection audience={post.audience} />
<RelatedArticlesSection posts={relatedPosts} />   ← nueva
```

Diseño sugerido: 4 tarjetas (título + resumen corto), grilla 2x2 en mobile,
4 en fila en desktop — mismo patrón visual que ya se usa en otras grillas de
tarjetas del sitio.

---

## 3. Qué pasa con artículos nuevos en el futuro

**Nada manual más allá de publicar bien.** Al crear un artículo nuevo, el
único paso extra es asignarle un `topic_cluster` (uno de los 8 existentes, o
uno nuevo si el tema no encaja en ninguno). Desde ese momento:
- Aparece automáticamente como relacionado en los demás artículos de su cluster
- Automáticamente muestra sus propios relacionados (los del cluster, con
  fallback a audience si el cluster es chico)

No hay que tocar ningún otro artículo ni curar links a mano.

---

## 4. Verificación sugerida al implementar

1. Correr la migración + los 8 `UPDATE` de la sección 2.2
2. `SELECT slug, topic_cluster FROM blog_posts WHERE locale = 'en' ORDER BY topic_cluster;`
   — confirmar que los 23 temas quedaron clasificados, ninguno con `NULL`
3. Probar la consulta de la sección 2.3 contra 2-3 slugs de clusters chicos
   (ej. `muqarana-khayarat-tahwil-alamwal-alsharq-alawsat`, el único de
   `middle-east`) para confirmar que el fallback trae los 4 igual
4. Verificar visualmente en al menos un idioma no-inglés que los títulos/
   resúmenes de las tarjetas relacionadas salen en el idioma correcto (no en
   inglés por error de join)
