# Visual Revamp — Necrópolis Premium

## Resumen

Rediseño visual completo de **Zombie Clicker** para darle una estética de juego premium, oscura y profesional. Se mantiene la arquitectura actual (HTML/CSS/JS vanilla, sin dependencias) y se trabaja exclusivamente con CSS + SVGs vectoriales inline.

- **Estilo:** Dark fantasy / horror premium.
- **Alcance:** CSS + SVGs/ilustraciones vectoriales hechas en código.
- **Prioridad:** Desktop y mobile por igual.
- **Animaciones:** Ricas pero respetuosas de `prefers-reduced-motion`.
- **Zombie principal:** Reemplazo del emoji 🧟 por SVG custom.

---

## 1. Filosofía visual y paleta

### Sensación objetivo

Interfaz de juego de terror pulido: oscura, con profundidad, materiales de "cristal contaminado" y luces de neón tóxico que guían la atención. El jugador debe sentir que está en una necrópolis digital.

### Paleta de colores

```css
--bg-void: #030503;
--bg-900: #070a07;
--bg-800: #0d120d;
--bg-700: #161c15;
--bg-600: #212821;

--green-500: #6ecf2f;
--green-400: #9aff4d;
--green-300: #c8ff99;
--green-glow: rgba(110, 207, 47, 0.4);

--red-500: #9e1b1b;
--red-400: #e62e2e;
--red-glow: rgba(230, 46, 46, 0.35);

--gold-400: #d4a017;
--gold-500: #ffbf00;

--text-primary: #f0f7ec;
--text-secondary: #8fa085;
--text-muted: #55664f;
--border: rgba(110, 207, 47, 0.12);
```

### Texturas y atmósfera

- Ruido de película sutil (SVG data URI) sobre el fondo general.
- Niebla radial animada muy lentamente en el stage del clicker.
- Bordes con gradiente verde → transparente en cards importantes.
- Sombras largas y difuminadas para crear profundidad.

---

## 2. Tipografía

- **Display:** `Creepster` (mantener). Usar solo para título principal del juego y títulos de sección grandes.
- **UI / body:** `IBM Plex Sans`. Pesos 400, 500, 600, 700.
- **Números y stats:** `Share Tech Mono`. Ideal para cerebros, BPS, costos.

Ajustes:
- Tamaños de display más grandes y con mayor tracking en títulos principales.
- Números con `font-variant-numeric: tabular-nums` para evitar saltos al actualizarse.
- Mejorar contraste de `text-secondary` y `text-muted` respecto al fondo oscuro.

---

## 3. Layout y estructura

Se mantiene el layout de 3 columnas en desktop:

```
[ Clicker stage ] [ Tienda ] [ Side panel ]
```

### Mejoras estructurales

- `#topbar`: más compacto y premium. Logo + stats centrales (Cerebros, BPS, Almas) + acciones a la derecha. En desktop se ocultan los stats duplicados del hero para no repetir información.
- `#main`: max-width 1600px, gap 20px, padding responsive.
- Cards con fondo `bg-800`, borde sutil degradado, sombra profunda y `backdrop-filter: blur()` en soportados.
- `#clicker-card` pasa a ser un "stage" inmersivo: fondo con niebla, bordes con brillo verde sutil, zombie centrado como elemento heroico.

### Mobile

- Bottom nav con 4 pestañas: Juego, Logros, Prestigio, Stats.
- Cada pestaña muestra una sola columna a pantalla completa.
- Touch targets mínimo 44px.
- Navegación inferior con backdrop blur y borde superior degradado verde.

---

## 4. Componentes clave

### 4.1 Header / Topbar

- Fondo `bg-900` con opacidad 0.95 y `backdrop-filter: blur(12px)`.
- Logo con icono SVG de zombie miniatura en lugar de emoji.
- Stats centrados en formato vertical: label pequeño en `text-muted`, valor grande en `Share Tech Mono`.
- Iconos de acción (guardar, reiniciar, ayuda) como SVGs con estados hover/active.

### 4.2 Clicker stage

- Fondo degradado radial con niebla animada.
- Zombie SVG custom centrado dentro de un círculo pulsante con borde degradado.
- Score heroico encima del zombie: "Cerebros" en grande, "Por segundo" debajo.
- Hint inferior más sutil.
- Partículas flotantes de polvo/contaminación.

### 4.3 Tarjetas de tienda (generadores / mejoras / cosméticos)

- Cards de "cristal oscuro": fondo `bg-700`, borde degradado verde oscuro, sombra interior sutil.
- Icono SVG a la izquierda en círculo de fondo.
- Estados:
  - `.affordable`: borde verde brillante + glow.
  - `.disabled`: opacidad reducida + cursor not-allowed.
  - `.owned`: borde verde sólido + fondo con tinte verde.
- Tabs de tienda con estilo de botones segmentados premium.
- Barra de cantidad (x1 / x10 / Max) con estilo de chips.

### 4.4 Panel lateral (Logros / Prestigio / Stats)

- Tabs laterales con iconos SVG.
- Logros: locked con candado SVG y opacidad; unlocked con brillo verde.
- Prestigio: panel dorado/rojo para resaltar importancia; botón "Ascender" con gradiente sangre y glow rojo.
- Stats: filas limpias con separadores sutiles.

### 4.5 Toasts y eventos

- Toasts con borde izquierdo de color, glow sutil y barra de progreso.
- Cerebro dorado: SVG con glow dorado animado.
- Jefe de horda: SVG más grande con aura roja y temblor.

---

## 5. SVGs e ilustraciones vectoriales

### Zombie principal

SVG inline dentro de `#zombie-btn` en `index.html`. Elementos:
- Cabeza con piel verde grisácea.
- Ojos grandes con brillo verde neón pulsante.
- Boca con dientes, se abre ligeramente al clickear.
- Costuras y parches en la piel.
- Aura exterior con glow verde configurable por cosméticos.

El SVG debe ser puro markup (no `<img>` ni background) para permitir animaciones CSS en sus partes.

### Iconos de generadores

Reemplazar emojis por SVGs pequeños (32×32px) estilizados:
- Superviviente asustado
- Mordedor
- Corredor
- Rabioso
- Jefe zombie
- Horda
- Necrópolis
- Virus Alfa
- Apocalipsis
- Zombie Dios

### Iconos de eventos

- Cerebro dorado: SVG con brillo y reflejos.
- Jefe de horda: SVG más grande con cuernos, ojos rojos y aura.

### Iconos de UI

- Guardar, reiniciar, ayuda, logros, prestigio, stats.

### Decoración ambiental

- Grietas en bordes de cards (SVG data URI o pseudo-elementos).
- Niebla radial animada.
- Partículas flotantes de polvo/bacterias en el stage.

---

## 6. Animaciones y efectos

Todas las animaciones ambientales deben respetar `prefers-reduced-motion: no-preference`.

### Idle

- Zombie respira (escala 1 → 1.03 cada 3.2s).
- Ojos del zombie parpadean cada 4-7s.
- Aura del zombie pulsa suavemente.
- Niebla del stage se mueve muy lentamente.

### Interacción

- Click en zombie: escala 0.92 → 1.06 → 1, cambio de expresión, micro screen-shake del stage.
- Texto flotante `+X` con rastro y fade out.
- Compra de generador: flash verde en card + pop del contador.
- Logro desbloqueado: shine dorado + pequeña explosión de partículas.

### Eventos

- Cerebro dorado: flota en trayectoria curva, pulsa, desaparece suavemente.
- Jefe de horda: aparece con escala 0 → 1, tiembla con aura roja, desaparece al derrotarlo.

### Transiciones

- Hover de cards: 150ms ease en background, border-color, box-shadow, transform.
- Cambios de tabs: 200ms fade/slide.
- Cambios de stats: animación `countPop` de 250ms.

---

## 7. Mobile

- Bottom nav fija con 4 tabs, iconos SVG + etiquetas.
- `#col-clicker` ocupa toda la altura disponible en pestaña Juego.
- `#col-shop` y `#col-side` muestran cards a ancho completo con padding consistente.
- Touch targets mínimo 44px.
- Reducir ligeramente el tamaño del zombie SVG en pantallas < 480px.
- Mantener legibilidad de números grandes con `font-size: clamp()`.

---

## 8. Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `style.css` | Reescritura mayor: variables, componentes, media queries, keyframes, SVG data URIs. |
| `index.html` | Ajustes menores: estructura del zombie SVG, iconos inline, clases semánticas. |
| `ui.js` | Actualizar `buildGeneratorCard`, `buildUpgradeCard`, `buildCosmeticCard`, `renderAchievements`, `renderPrestige`, `renderStats` para usar SVGs en lugar de emojis donde corresponda. Lógica del juego sin cambios. |
| `game.js` | Sin cambios de lógica. Posible ajuste menor en definiciones de cosméticos si se renombran slots. |
| `tests/logic.test.js` | Debe seguir pasando sin modificaciones. |

No se añaden dependencias, frameworks, sonidos ni backend.

---

## 9. Accesibilidad

- Mantener o mejorar los `aria-label` existentes.
- Asegurar que todos los textos tengan contraste WCAG AA contra los fondos oscuros.
- Las animaciones ambientales deben respetar `prefers-reduced-motion`.
- Los SVGs decorativos deben usar `aria-hidden="true"`; los SVGs con significado deben llevar `role="img"` + `aria-label`.

---

## 10. Criterios de éxito

- [ ] El juego se ve profesional y con estética de juego premium oscuro.
- [ ] No hay emojis en elementos principales (zombie, generadores, eventos, iconos de UI).
- [ ] Desktop y mobile mantienen/usan el nuevo estilo sin regresiones.
- [ ] Las animaciones respetan `prefers-reduced-motion`.
- [ ] `node tests/logic.test.js` pasa sin errores.
- [ ] El save en `localStorage` sigue funcionando.
- [ ] Los cosméticos existentes (skins, auras, fondos) siguen aplicándose visualmente con el nuevo estilo.

---

## 11. Notas de implementación

- Usar SVGs inline como strings dentro de `ui.js` o como data URI en CSS según convenga.
- Mantener nombres de IDs y clases existentes siempre que sea posible para no romper `ui.js`.
- Los cosméticos actuales deben seguir funcionando: las reglas `[data-skin]`, `[data-aura]`, `[data-bg]` deben adaptarse al nuevo zombie SVG y al stage.
- Si un SVG no cabe bien en un elemento pequeño, usar versión simplificada o fallback al emoji original como último recurso.
- Probar en Chrome/Edge, Firefox y móvil (devtools) antes de dar por terminado.
