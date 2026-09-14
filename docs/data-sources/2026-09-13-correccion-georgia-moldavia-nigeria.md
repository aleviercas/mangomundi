# Corrección: Georgia/Moldavia NO son casos fuertes — Nigeria sí — 2026-09-13

> Sigue a `2026-09-13-paises-prioridad-cripto.md`. Investigué antes de agregar
> nada, como pediste, y el resultado corrige mi entusiasmo anterior con Georgia y
> Moldavia.

---

## 1. Georgia y Moldavia — corrección honesta

La priorización anterior se basó solo en el índice de adopción per cápita de
Chainalysis, sin verificar si la moneda local realmente tiene el problema de
brecha oficial-vs-paralelo que hace valiosa la opción cripto (el mismo problema
que resolvimos para ARS/VES). Verificado ahora:

- **Georgia (GEL)**: moneda de **flotación libre**. El tipo P2P de Binance
  (2,58-2,66 GEL/USDT en las mejores ofertas) está casi pegado al tipo de mercado
  libre que muestran XE/Wise (2,60 GEL/USD). No hay una brecha oficial-vs-paralelo
  que explotar.
- **Moldavia (MDL)**: mismo patrón. Binance P2P (mejores ofertas: 17,19-17,27
  MDL/USDT) está prácticamente igual al mid-market de XE (17,25 MDL/USD).

**Conclusión: ninguna de las dos encaja en la tesis "moneda volátil → margen alto"
para efectos de cripto** — mostrar la opción acá no le ahorraría plata real al
usuario frente a un canal tradicional bien cotizado, porque no hay brecha que
cerrar.

**Esto no significa que no haya nada interesante en esa región** — la alta
adopción per cápita probablemente se explica por otra cosa: Georgia como
hub/tránsito de capital ruso post-sanciones (coincide con lo que ya encontramos el
10-sep: Rusia está excluida de los proveedores occidentales tradicionales). Es una
historia distinta ("puente para dinero bloqueado", no "moneda en crisis") que
podría investigarse por separado, pero **no es el mismo tipo de hallazgo que
Venezuela**, y no lo voy a presentar como si lo fuera.

## 2. Nigeria — confirmado, historia mucho más fuerte

A diferencia de Georgia/Moldavia, Nigeria sí tiene una brecha real, grande y bien
documentada:

> *"Bank wire transfers are converted at rates closer to the CBN official rate,
> which can be 10 to 20 percent lower than the parallel market rate that USDT
> trades at. A $2,000 wire transfer converted at the official rate might yield 2.9
> million Naira, while 2,000 USDT converted at the parallel market rate yields 3.2
> million Naira."* (monica.cash, plataforma de conversión USDT-Naira)

Con ese ejemplo: diferencia de 300.000 Naira sobre USD 2.000 = **~9,4% más recibido
vía USDT que vía transferencia bancaria oficial** — consistente con la brecha del
10-20% citada. El propio Banco Central de Nigeria llegó a **detener ejecutivos de
Binance y forzar un tope de precio** al USDT en 2024 porque el mercado P2P estaba
revelando la devaluación real que el gobierno no quería reflejar en el tipo
oficial — la misma dinámica que ya vimos con Venezuela (BCV oficial vs. paralelo),
solo que en Nigeria el propio banco central peleó activamente contra el mercado
P2P, lo cual es una confirmación todavía más fuerte de que la brecha es real y
económicamente significativa.

**Nigeria ya tiene cobertura tradicional sólida (36 filas, 14 proveedores)** — la
opción cripto acá sería un complemento genuino, no llenaría un vacío, pero el caso
de negocio (brecha real y grande) es mucho más fuerte que Georgia/Moldavia.

## 3. Prioridad actualizada

1. **Venezuela + Argentina** — sin cambios, ya confirmados con datos reales.
2. **Nigeria** — sube de prioridad, reemplaza a Georgia/Moldavia como el próximo
   candidato lógico. Brecha real, grande, bien documentada, y con el precedente
   más dramático de todos (el banco central peleando activamente contra el
   mercado P2P).
3. **Georgia y Moldavia** — bajan de prioridad para la opción cripto
   específicamente (no hay brecha que explotar). Si en algún momento se investiga
   el ángulo "puente para dinero bloqueado por sanciones", sería una línea de
   research distinta, no una extensión de esta.
4. **Pakistán** — sin verificar todavía si tiene una brecha real como Nigeria o es
   más como Georgia (adopción alta por otras razones) — pendiente para la próxima
   ronda antes de subirlo de prioridad.

---

## 4. Estado de esta sesión

Solo investigación — no se cargó nada a Supabase. Esto reemplaza la
recomendación de Georgia/Moldavia del documento anterior; Nigeria queda como el
candidato Tier 1 más sólido después de Venezuela/Argentina.
