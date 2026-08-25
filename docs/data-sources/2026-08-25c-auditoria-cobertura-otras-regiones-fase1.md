# Auditoría de cobertura — Sudeste Asiático, Medio Oriente/Golfo y Europa del Este (fase 1, 25 ago 2026)

**Estado: FASE 1 completa (investigación de cobertura con fuente primaria), FASE 2 (cotización en vivo) no iniciada.** Mismo método que las rondas anteriores: solo se identifican corredores reales de alto volumen no cargados, citando fuente primaria — sin cotizar precios todavía (eso requiere navegador, más costoso en tokens, y se hace en una ronda separada). Investigación detallada completa disponible en el proyecto Mangomundi: `investigacion-sudeste-asiatico-2026-08-25.md`, `investigacion-medio-oriente-golfo-2026-08-25.md`, `investigacion-europa-del-este-2026-08-25.md`, `reverificacion-europa-del-este-ria-moneygram-2026-08-25.md`.

---

## 1. Sudeste Asiático (más allá de Filipinas/Vietnam)

Países objetivo como receptores: Indonesia, Tailandia, Malasia, Camboya, Myanmar, Laos.

**Positivos confirmados:**
- Western Union: cubre los 6 países. Arabia Saudita→Indonesia, Malasia→Indonesia, Tailandia→Myanmar (cash pickup 1.200+ ubicaciones + banco), Camboya/Laos habilitados desde Tailandia.
- MoneyGram: cubre los 6. Indonesia vía BRI, Camboya vía ABA Bank, Myanmar vía Wave Money/AYA/Yoma Bank, corredores HK/SG→Tailandia/Malasia.
- Remitly: cubre los 6 (todos desde EE.UU.). Camboya con red amplia (ABA, ACLEDA, Wing Money + 20 bancos), Myanmar con KBZPay + 5 bancos.
- Ria Money Transfer: cubre los 6. Partnership DANA (Indonesia) nombra emisores reales: Malasia, Arabia Saudita, Singapur, Hong Kong, Taiwán. Partnership ACLEDA (Camboya): Tailandia y Malasia como emisores de alto volumen.
- Wise: Indonesia↔Malasia bidireccional (único con emisor real desde Indonesia); Camboya y Laos como destino.
- TapTap Send: Malasia (bancos + BigPay/TNG vía DuitNow), Camboya (Wing cash pickup), Tailandia (artículo de ayuda dedicado). Indonesia solo por fuente secundaria — re-verificar.
- Sendwave: Indonesia, Tailandia y Malasia en su lista oficial.

**Negativos confirmados:**
- WorldRemit: Myanmar y Laos ausentes de su lista de destinos en Asia; como emisor solo Malasia.
- Wise: Myanmar explícitamente no soportado.
- TapTap Send: Myanmar y Laos ausentes; no opera como emisor desde ninguno de los 6 países.
- Sendwave: Camboya, Myanmar y Laos ausentes.
- LemFi: ninguno de los 6 soportado (su cobertura asiática es Bangladesh/China/India/Nepal/Pakistán/Filipinas/Sri Lanka/Vietnam).
- NALA: ninguno de los 6 soportado (su única presencia asiática es Filipinas/Pakistán/India/Bangladesh).

**Corredores emisores inversos confirmados:** Malasia→Indonesia, Tailandia→Camboya/Myanmar/Laos.

**Prioridad sugerida para fase 2:** Arabia Saudita→Indonesia (WU), Tailandia→Myanmar (WU), corredores DANA de Ria hacia Indonesia.

---

## 2. Medio Oriente / Golfo (más allá de los corredores a India ya cargados)

Países emisores objetivo: EAU, Arabia Saudita, Catar, Kuwait, Baréin, Omán. Receptores: Pakistán, Bangladesh, Nepal, Sri Lanka, Filipinas, Egipto, Jordania, Líbano, Indonesia.

**Positivos confirmados:**
- Western Union: EAU→Pakistán/Bangladesh/Filipinas/Egipto/Indonesia/Líbano; Arabia Saudita→Filipinas/Bangladesh/Egipto/Indonesia; Catar→Filipinas/Líbano; Kuwait→Egipto/Líbano; Baréin→Filipinas/Egipto.
- Remitly: EAU es su único emisor en el Golfo, pero con matriz completa a los 9 destinos pedidos (confirmado por fetch directo a cada corredor).
- Wise: EAU con 8 de 9 destinos confirmados (pakistan, bangladesh, philippines, egypt, nepal, sri-lanka, lebanon, indonesia).
- Al Ansari Exchange (EAU) — especialista del Golfo no catalogado antes: 7 de 9 destinos confirmados (pakistan, philippines, bangladesh, egypt, nepal, sri-lanka, jordan).
- Wall Street Exchange (EAU): EAU→Pakistán confirmado.
- TapTap Send: hallazgo nuevo — sí opera desde EAU (confirmado por soporte oficial + prensa); destinos específicos quedaron como hueco de dato.

**Negativos confirmados:**
- Remitly: NO opera como emisor desde Arabia Saudita, Catar, Kuwait, Baréin ni Omán (404 consistente en los 5 países, solo EAU funciona).
- WorldRemit: no ofrece envío desde EAU (ausente de su propia lista "send from Middle East"); sí confirma Baréin/Kuwait/Omán/Catar/Arabia Saudita como emisores pero sin matriz de destino confirmada todavía.

**Huecos de dato (no negativos, solo no verificados esta sesión — la herramienta de investigación se quedó sin cupo a mitad de la ronda):**
- MoneyGram: bloquea el fetch automatizado en el 100% de los intentos; opera retail en los 6 países pero ningún corredor específico confirmado ni descartado — recomendado retomar con navegador real.
- Ria Money Transfer: no tiene subsitio propio para ningún país del Golfo — probablemente solo red de agentes/payout, sin producto online propio de origen ahí.
- Gran parte de la matriz Catar/Kuwait/Baréin/Omán en Western Union y Wise, Jordania e Indonesia/Líbano en Al Ansari, y toda la matriz de Lulu Exchange/Xpress Money.
- Instarem, exchange4free, Sendwave, LemFi, NALA: sin evidencia de que operen desde el Golfo (ausencia de evidencia, no negativo confirmado).

**Prioridad sugerida para fase 2:** MoneyGram con navegador real (para superar el bloqueo anti-bot), y leer el artículo de TapTap Send sobre EAU para confirmar destinos específicos.

---

## 3. Europa del Este (más allá de MoneyGram DE→PL ya cargado)

Países objetivo como receptores: Ucrania, Moldavia, Rumania, Bulgaria, Polonia, Hungría, República Checa, Serbia, Bosnia. Contexto: migración laboral de Europa del Este hacia Europa Occidental, más el flujo humanitario hacia Ucrania/Moldavia desde 2022.

**Positivos confirmados:**
- Western Union: GB→UA/MD/RO/BG/PL/HU/CZ, US→RS, GB→BA, US→UA/MD.
- MoneyGram: US→UA/MD, FR→MD/BG, GB→RO/PL, CZ→PL, US→HU, DE→CZ/RS, AT→BA.
- Remitly: matriz completa US→{UA, MD, RO, BG, PL, HU, RS, CZ, BA}.
- Wise: opera en moneda local directa para RO/RS/BA/PL/HU/CZ (RON/RSD/BAM/PLN/HUF/CZK).
- Ria: US→UA/RO confirmados; US→MD como corredor especial solo tarjeta/cuenta (agrupado con Armenia/Georgia) — profundizar. **Bulgaria, Serbia y Bosnia: re-verificados 25-ago (ver abajo), los tres confirmados como corredores reales y activos, no solo páginas placeholder.**
- Paysend: matriz amplia GB/US/DE/CZ/MD→9 países.
- Xoom: matriz completa, página propia por país para los 9 destinos.

**Negativos confirmados — el hallazgo más importante de esta región:**
- **WorldRemit NO opera ningún corredor hacia Europa del Este.** Tres fuentes propias cruzadas lo confirman: su página "send to Europe" lista solo Albania y Turquía; declara textualmente que no ofrece transferencias bancarias a países de Europa; su sección de cash pickup para Europa aparece vacía; y lista a Ucrania explícitamente como no soportada para transferencias de negocio. **Cross-check contra el catálogo (25-ago): se confirmó por SQL directo contra `fx_rates` que WorldRemit no tiene ninguna fila cargada hacia ningún país de Europa del Este (BG, RS, BA, PL, RO, HU, HR, SI, SK, UA, MD, AL, MK, ME) — cero filas. No hay conflicto ni dato incorrecto que corregir; el hallazgo negativo queda cerrado.**
- Wise: Ucrania, Moldavia y Bulgaria explícitamente NO soportados en moneda local ("we're working hard... but we're not quite there yet"); solo wire transfer en USD para Moldavia (fee ~9 USD, no es un envío real en moneda local).
- TapTap Send, Sendwave, LemFi, NALA: ninguno de los cuatro tiene un solo corredor hacia Europa del Este — los cuatro se autodescriben o listan explícitamente como especializados en África/Asia/Latinoamérica, sin presencia en la región.

**Re-verificación de los casos puntuales que habían quedado sin confirmar (cerrada 25-ago-2026, ver `reverificacion-europa-del-este-ria-moneygram-2026-08-25.md` en el proyecto):**
- **Ria → Bulgaria: CONFIRMADO, corredor real y activo.** riamoneytransfer.com/en-us/send-money-to-bulgaria/ — calculadora en vivo, no placeholder. Payout: cash pickup (6.000+ ubicaciones, partners EasyPay y Correos búlgaros), banco, billetera móvil (ePay.bg).
- **Ria → Serbia: CONFIRMADO, corredor real y activo.** riamoneytransfer.com/en-us/send-money-to-serbia/ — tasa en vivo (1 USD≈100.09 RSD). Payout: cash pickup (2.900+ ubicaciones, partners TransferNova, Correos serbios, PaySpot, Raiffeisen, OTP Bank, ERSTE, AIK Banka), banco. Sin billetera móvil confirmada.
- **Ria → Bosnia: CONFIRMADO, corredor real (detalle más limitado).** riamoneytransfer.com/en-us/send-money-to-bosnia-and-herzegovina/ — tasa en vivo (1 USD≈1.69 BAM). Payout: cash pickup (100+ ubicaciones, sin partners nombrados), banco.
- **MoneyGram → Bulgaria: NO confirmado por fuente primaria directa — bloqueo anti-bot persistente (403 en las 4 URLs probadas, incluyendo `/corridor/bulgaria` desde dos países emisores distintos y el localizador de agentes). Evidencia indirecta fuerte** (sitio localizado `moneygram.com/bg/en` indexado con corredores propios, localizador de agentes con ciudades búlgaras reales — Sofia, Sofia-City, Dobrich/Albena —, artículo de ayuda "How to receive money from MoneyGram in Bulgaria", y páginas de corredor hacia Bulgaria desde EE.UU./Irlanda/Singapur indexadas), pero sin lectura de contenido primario confirmada. **Se recomienda verificación con navegador real (no WebFetch/WebSearch) antes de cargar cualquier precio para este corredor específico.**

**Prioridad sugerida para fase 2:** Ucrania y Moldavia en los proveedores de mayor volumen (Western Union, Remitly, MoneyGram, Xoom, Paysend) por el volumen humanitario real; MoneyGram→Bulgaria con navegador real para cerrar el único caso que sigue sin confirmación de fuente primaria directa.

---

## Próximo paso

Estas tres investigaciones quedan listas para pasar a fase 2 (cotización en vivo con navegador) en una próxima sesión, priorizando por volumen real: Golfo→Sur de Asia/Filipinas (el mercado de remesas más grande del mundo), Ucrania/Moldavia (volumen humanitario), y los corredores del sudeste asiático con mejor evidencia (Arabia Saudita→Indonesia, Tailandia→Myanmar). Ninguna de las tres regiones tiene todavía precios cargados en `fx_rates` — toda esta fase 1 es solo de cobertura, no de pricing.
