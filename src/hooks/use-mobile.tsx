import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  return useIsNarrowerThan(MOBILE_BREAKPOINT);
}

/** 2026-09-09 feedback — bug real encontrado al revisar "cómo se mueve al
 *  cambiar el tamaño de pantalla": `useIsMobile` (arriba, 768px) decide
 *  cuándo ComparatorSection porta la barra de búsqueda entera al header
 *  (`mergeSearchIntoHeader`), pero `#header-searchbar-slot` (styles.css)
 *  exige `min-width: 680px`, y el resto de esa misma fila (☰ 36px + logo
 *  ~150px + botón "Ask AI" ~160px + paddings/gaps ~100px) necesita otros
 *  ~450px — total real ≈1080-1100px, no 768px. Entre 768px y ese punto la
 *  fila se desborda (los flex-items no bajan de su min-width): "zona
 *  muerta" donde el header se rompe visualmente.
 *
 *  Extraído como hook genérico (no específico a 768) para poder usar un
 *  umbral más ancho — ver `HEADER_SEARCH_MERGE_MIN_WIDTH` en
 *  ComparatorSection.tsx — sin tocar `useIsMobile` ni ningún otro lugar que
 *  ya depende del corte de 768px real (el propio `Combobox.tsx`, para
 *  cuándo abrir el picker como Drawer de pantalla completa en vez de
 *  Popover, sí quiere el corte real de "es un teléfono", no éste). Estimado
 *  a partir de las clases reales del header, no medido en vivo contra un
 *  navegador — confirmar con Alejandro si en algún ancho intermedio se ve
 *  raro igual y ajustar el número. */
export function useIsNarrowerThan(breakpoint: number) {
  const [isNarrow, setIsNarrow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsNarrow(window.innerWidth < breakpoint);
    };
    mql.addEventListener("change", onChange);
    setIsNarrow(window.innerWidth < breakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return !!isNarrow;
}
