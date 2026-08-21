# Zombie Clicker — Rediseño profesional v3 (design doc)

## Objetivo

Transformar Zombie Clicker en un juego con **estética profesional, coherente visual y UX pulida**, sin cambiar de stack: seguimos en HTML/CSS/JS vanilla y sin build step. Se prioriza el "feel" de un juego incremental moderno: feedback inmediato, progresión clara, animaciones satisfactorias y una interfaz que no se sature.

## Principios de diseño

1. **Claridad antes que ornamentación**: cada número, botón y mensaje debe leerse al instante.
2. **Feedback en cada acción**: click, compra, logro y evento tienen que sentirse. Nada pasa en silencio.
3. **Progresión visible**: el jugador siempre sabe cuánto falta para la próxima compra, el próximo logro o el próximo prestige.
4. **Tema zombie adulto**: oscuro, siniestro pero limpio. No caricaturesco. Verde podrido + rojo sangre + grises fríos.
5. **Mobile-first responsive**: se juega principalmente con el mouse, pero debe verse bien en celular.

## Identidad visual

### Paleta de colores

```css
:root {
  --bg-900: #070a07;        /* fondo principal */
  --bg-800: #0f140f;        /* paneles */
  --bg-700: #1a221a;        /* tarjetas */
  --bg-600: #263026;        /* hover */

  --green-500: #7fbf3f;     /* acento principal (podrido) */
  --green-400: #a3d96a;     /* hover/ brillos */
  --green-300: #c8f2a1;     /* textos de valor */
  --green-glow: rgba(127, 191, 63, 0.35);

  --red-500: #c0392b;       /* sangre / eventos peligrosos */
  --red-400: #e74c3c;       /* hover sangre */
  --red-glow: rgba(192, 57, 43, 0.35);

  --gold-400: #f1c40f;      /* cerebro dorado / recompensas */
  --gold-500: #f39c12;

  --text-primary: #eef2ea;
  --text-secondary: #9caf95;
  --text-muted: #5d705a;
  --border: rgba(127, 191, 63, 0.12);
}
```

### Tipografía

- **Títulos/Display:** `'Creepster', 'Impact', fantasy, sans-serif` para el logo y títulos de sección. Creepster se carga desde Google Fonts con fallback a Impact.
- **Números/Stats:** `'Roboto Mono', 'Consolas', monospace` para cerebros, BPS y costos (monoespaciado facilita leer números crecientes).
- **Cuerpo:** `'Inter', 'Segoe UI', system-ui, sans-serif` para descripciones y botones.

### Iconografía

- Emojis nativos para generadores y logros (sin dependencias externas).
- Iconos simples hechos con CSS/SVG para acciones: guardar, reset, tabs, cerrar toast.

## Layout general

### Desktop (>= 1024px)

Un layout de tres columnas tipo dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│  [🧟 Zombie Clicker]    [Cerebros] [BPS] [Almas] [💾] [↺]  │  header
├──────────────────┬──────────────────────────┬───────────────┤
│                  │                          │               │
│   ZONA DE CLICK  │      TIENDA (tabs)       │   LOGROS /    │
│                  │   Generadores | Mejoras  │   PRESTIGIO   │
│   [🧟 zombie]    │   [item] [item] ...      │               │
│   +1 por click   │                          │   mini-stats  │
│                  │                          │               │
│  eventos flotantes│                          │               │
│                  │                          │               │
└──────────────────┴──────────────────────────┴───────────────┘
```

- **Columna izquierda (40%)**: clicker grande, stats principales, eventos flotantes.
- **Columna central (35%)**: shop con pestañas Generadores / Mejoras.
- **Columna derecha (25%)**: panel combinado de Logros + Prestigio + mini estadísticas, con sub-tabs internos.

### Tablet (768px - 1023px)

Dos columnas: clicker a la izquierda, shop + logros/prestigio a la derecha apilados.

### Mobile (< 768px)

Una sola columna, tabs principales en la parte inferior tipo navegación fija:
- Juego (clicker + shop)
- Logros
- Prestigio
- Stats

## Componentes

### Header

- Logo a la izquierda con tipografía Creepster y subtítulo "Incremental" en texto pequeño y muted.
- Stats en el centro: Cerebros (grande, verde), BPS (verde muted), Almas (rojo sangre).
- Acciones a la derecha: botón redondo guardar (💾), reset (↺) y un indicador de último guardado.

### Clicker Zone

- Botón/zombie grande circular (280px desktop, 200px mobile) con gradiente radial, borde verde glow y sombra.
- Al hacer click:
  - escala 0.92 → 1.02 con elastic easing.
  - partícula verde que sale del centro.
  - número flotante `+X` que sube y desvanece.
  - breve cambio de emoji 🧟 → 💀 y vuelta.
- Indicador "+X por click" debajo.
- Barra de progreso circular opcional hacia el próximo generador/upgrade asequible.

### Shop

- Tabs pill-style: "Generadores" / "Mejoras".
- Cada ítem es una tarjeta con:
  - Icono + nombre + descripción corta.
  - Costo a la derecha (monoespaciado).
  - Cantidad poseída (solo generadores).
  - Estado visual: normal, comprable (brillo sutil), no comprable (opacidad 0.5), comprado (solo mejoras).
- Botones x1 / x10 / Max en generadores, pequeños y alineados.
- Hover: leve elevación y borde verde.
- Al comprar: flash verde en la tarjeta, número de cantidad hace "pop".

### Logros

- Lista vertical de tarjetas compactas.
- Cada logro muestra: icono, nombre, descripción, bonus +2%, estado (bloqueado/desbloqueado).
- Los desbloqueados tienen borde verde y fondo sutil; los bloqueados son grises con candado.
- Barra de progreso hacia el próximo logro.

### Prestigio

- Card prominente con:
  - Almas actuales.
  - Almas que ganarías si ascendés ahora.
  - Multiplicador global actual.
  - Botón "Ascender" grande, sangre, deshabilitado si no da almas.
- Tienda de prestige debajo con upgrades permanentes, mostrando costo y efecto.

### Estadísticas

- Grid de stats: cerebros totales, clicks, tiempo jugado, mejor BPS, generadores totales, logros desbloqueados.
- Botones de exportar/importar save.

### Eventos

- **Cerebro dorado**: aparece como un orbe dorado flotante con glow, pulsación. Al clickar, explota en partículas doradas y toast.
- **Horda**: banner rojo oscuro que entra desde arriba con barra de vida. Clickar rápido reduce la vida. Al morir, shake de pantalla y recompensa.

### Toasts

- Esquina inferior derecha, apilados.
- Tipos: `success` (verde), `warn` (rojo), `info` (gris).
- Icono + mensaje + barra de progreso que se vacía.

## Animaciones

- **Transiciones base**: 150ms ease para estados, 200ms para transforms.
- **Click**: scale + particle + float text.
- **Compra**: flash + count pop.
- **Logro desbloqueado**: card slide-in + shine.
- **Eventos**: spawn con bounce, despawn con fade.
- **Prestige**: transición de pantalla con fade a negro y mensaje central "La horda renace".

## Responsive detalle

- En desktop, el clicker no se mueve al hacer scroll.
- En mobile, las tabs principales son fijas abajo (altura ~64px) para cambiar con el pulgar.
- En mobile, el shop ocupa toda la pantalla cuando se selecciona su tab, para evitar scroll infinito.

## Stack y arquitectura

- **game.js**: se mantiene como lógica pura testeable. No se toca salvo ajustes menores.
- **ui.js**: refactor a funciones de render por componente. Se eliminan referencias a IDs inconsistentes. Se usa un `render()` central que decide qué repintar.
- **style.css**: reescritura completa con variables CSS, grid/flex, animaciones y media queries.
- **index.html**: estructura semántica clara con todos los IDs necesarios, sin contenido generado por JS.

## Testing

- `node tests/logic.test.js` sigue pasando (lógica pura).
- Se agrega un test visual mínimo: abrir `index.html` y verificar que las tabs funcionen y no haya errores en consola.

## Alcance fuera de este rediseño (YAGNI)

- No sonidos (a menos que se pida explícitamente después).
- No backend ni multijugador.
- No migración a framework.
- No cambios de balance de números (salvo que surja de la UI).

## Tareas de implementación (resumen)

1. Estructura HTML con IDs finales.
2. Sistema de diseño CSS (variables, tipografía, layout responsive).
3. Refactor de ui.js en componentes de render.
4. Arreglar tabs de Generadores / Mejoras.
5. Animaciones de click, compra, logros y eventos.
6. Mobile navigation inferior.
7. Pulido final y pruebas manuales.
