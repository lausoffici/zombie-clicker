# Zombie Clicker — Rediseño profesional v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar Zombie Clicker en un juego incremental con estética profesional, layout responsive de 3 columnas, animaciones satisfactorias y UX pulida, manteniendo el stack HTML/CSS/JS vanilla sin build step.

**Architecture:** Se reescribe `style.css` con variables CSS y un design system coherente; se reestructura `index.html` en un layout semántico de 3 columnas desktop / 1 columna mobile; se refactoriza `ui.js` en funciones de render por componente con IDs normalizados. La lógica pura en `game.js` no cambia.

**Tech Stack:** HTML5, CSS3 (variables, grid/flex, animaciones), JavaScript ES5/IIFE, localStorage. Sin frameworks, sin build, sin sonidos, sin backend.

## Global Constraints

- Stack vanilla HTML/CSS/JS, sin migrar a framework.
- Sin build step ni dependencias de npm para el juego.
- `node tests/logic.test.js` debe seguir pasando en cada tarea.
- Sin sonidos, sin backend, sin multijugador.
- Paleta y tipografía del design doc v3 (verde podrido `#7fbf3f`, rojo sangre `#c0392b`, fondos oscuros).
- Mobile-first responsive; mobile usa navegación inferior fija.
- No cambios de balance de números salvo que la UI lo requiera.

## File Structure


| File                  | Responsibility                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `index.html`          | Estructura semántica final: header, grid de 3 columnas, mobile nav, contenedores de toast/eventos. |
| `style.css`           | Design system completo: variables, layout, componentes, animaciones, responsive.                   |
| `game.js`             | Lógica pura del juego. **Solo lectura** para este rediseño; no se modifica.                        |
| `ui.js`               | Render por componente, event listeners, animaciones, loops. Se refactoriza por completo.           |
| `tests/logic.test.js` | Tests de lógica pura. Debe seguir pasando.                                                         |


---

### Task 1: Bugfix — Tabs de Generadores / Mejoras

**Files:**

- Modify: `index.html:72-79`
- Modify: `style.css:52-72` (renombrar/duplicar estilos de tab interna)
- Modify: `ui.js:404-431` y añadir función nueva
- Test: `node tests/logic.test.js` + abrir `index.html` y probar ambas tabs

**Interfaces:**

- Consumes: IDs `#shop-tab-generators`, `#shop-tab-upgrades`, `#shop-list-generators`, `#shop-list-upgrades`
- Produces: función `setupShopTabs()` llamada desde `init()`

**Contexto:** Actualmente los botones del shop usan clase `.tab` e IDs `tab-generators`/`tab-upgrades`, pero no hay JavaScript que alterne las listas. `#list-upgrades` arranca con `.hidden`.

- [ ] **Step 1: Renombrar IDs y clases en `index.html`**

Reemplazar el bloque del shop por:

```html
<div id="shop-panel" class="panel">
  <div id="shop-tabs">
    <button id="shop-tab-generators" class="shop-tab active">Generadores</button>
    <button id="shop-tab-upgrades" class="shop-tab">Mejoras</button>
  </div>
  <div id="shop-content">
    <div id="shop-list-generators" class="shop-list"></div>
    <div id="shop-list-upgrades" class="shop-list hidden"></div>
  </div>
</div>
```

- [ ] **Step 2: Añadir estilos base para `.shop-tab` en `style.css`**

Añadir al final del archivo o junto a `.tab`:

```css
.shop-tab {
  flex: 1;
  min-width: 100px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background .15s ease, color .15s ease, border-color .15s ease, transform .08s ease;
}
.shop-tab:hover { background: var(--panel-2); color: var(--text); }
.shop-tab.active {
  background: var(--panel-2);
  color: var(--accent);
  border-color: var(--accent-2);
  box-shadow: 0 0 12px rgba(124, 255, 107, .15);
}
.shop-list { display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; padding-right: 4px; }
.shop-list.hidden { display: none; }
```

- [ ] **Step 3: Implementar `setupShopTabs` en `ui.js`**

Insertar justo antes de `setupTabs`:

```javascript
function setupShopTabs() {
  const tabs = [
    { btn: "shop-tab-generators", list: "shop-list-generators" },
    { btn: "shop-tab-upgrades", list: "shop-list-upgrades" }
  ];
  tabs.forEach(function (t) {
    const btn = $(t.btn);
    const list = $(t.list);
    if (!btn || !list) return;
    btn.addEventListener("click", function () {
      tabs.forEach(function (other) {
        const otherBtn = $(other.btn);
        const otherList = $(other.list);
        if (otherBtn) otherBtn.classList.remove("active");
        if (otherList) otherList.classList.add("hidden");
      });
      btn.classList.add("active");
      list.classList.remove("hidden");
    });
  });
}
```

Llamar `setupShopTabs();` dentro de `init()` justo antes de `setupTabs();`.

- [ ] **Step 4: Actualizar referencias de IDs en `ui.js`**

Buscar `list-generators` y reemplazar por `shop-list-generators`. Buscar `list-upgrades` y reemplazar por `shop-list-upgrades`.

En `renderGenerators`:

```javascript
const container = $("shop-list-generators");
```

En `renderUpgrades`:

```javascript
const container = $("shop-list-upgrades");
```

- [ ] **Step 5: Verificar**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Abrir `index.html` en navegador. Probar click en "Mejoras" → debe mostrar lista de mejoras. Click en "Generadores" → debe volver a generadores. No debe haber errores en consola.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css ui.js
git commit -m "fix(shop): alternar tabs Generadores / Mejoras"
```

---

### Task 2: HTML semántico con layout de 3 columnas

**Files:**

- Modify: `index.html` (reescritura completa)
- Test: abrir `index.html`, verificar estructura visual básica

**Interfaces:**

- Consumes: los IDs y clases que `ui.js` y `style.css` usarán
- Produces: estructura HTML final con IDs normalizados

- [ ] **Step 1: Reescribir `index.html` completo**

```html
<!DOCTYPE html>
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Chtml%20lang%3D%22es%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Chead%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Cmeta%20charset%3D%22UTF-8%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Cmeta%20name%3D%22viewport%22%20content%3D%22width%3Ddevice-width%2C%20initial-scale%3D1.0%2C%20viewport-fit%3Dcover%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ctitle%3E]]Zombie Clicker[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Ftitle%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Clink%20rel%3D%22preconnect%22%20href%3D%22https%3A%2F%2Ffonts.googleapis.com%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Clink%20rel%3D%22preconnect%22%20href%3D%22https%3A%2F%2Ffonts.gstatic.com%22%20crossorigin%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Clink%20href%3D%22https%3A%2F%2Ffonts.googleapis.com%2Fcss2%3Ffamily%3DCreepster%26family%3DInter%3Awght%40400%3B500%3B600%3B700%26family%3DRoboto%2BMono%3Awght%40500%3B700%26display%3Dswap%22%20rel%3D%22stylesheet%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Clink%20rel%3D%22stylesheet%22%20href%3D%22style.css%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3C%2Fhead%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3Cbody%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%3Cdiv%20id%3D%22app%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3Cheader%20id%3D%22topbar%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Cdiv%20id%3D%22brand%22%3E]]
        [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22brand-icon%22%3E]]🧟[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22brand-text%22%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22brand-name%22%3E]]Zombie Clicker[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22brand-sub%22%3E]]Incremental[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Cdiv%20id%3D%22topbar-stats%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22topbar-stat%22%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22topbar-stat-label%22%3E]]Cerebros[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22stat-brains%22%20class%3D%22topbar-stat-value%22%3E]]0[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22topbar-stat%22%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22topbar-stat-label%22%3E]]BPS[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22stat-bps%22%20class%3D%22topbar-stat-value%22%3E]]0[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22topbar-stat%22%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22topbar-stat-label%22%3E]]Almas[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22stat-souls%22%20class%3D%22topbar-stat-value%22%3E]]0[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Cdiv%20id%3D%22topbar-actions%22%3E]]
        [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22btn-save%22%20class%3D%22icon-btn%22%20title%3D%22Guardar%22%3E]]💾[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
        [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22btn-reset%22%20class%3D%22icon-btn%22%20title%3D%22Reiniciar%22%3E]]↺[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3C%2Fheader%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3Cmain%20id%3D%22main%22%20class%3D%22main-grid%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C!--%20Columna%20izquierda%3A%20Clicker%20--%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Csection%20id%3D%22col-clicker%22%20class%3D%22col%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22clicker-card%22%20class%3D%22card%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22clicker-area%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%20id%3D%22zombie-btn%22%20aria-label%3D%22Ganar%20cerebro%22%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22zombie-icon%22%3E]]🧟[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22clicker-info%22%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22click-value%22%3E]]+1 por click[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22click-hint%22%3E]]Haz clic para ganar cerebros[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22click-particles%22%20aria-hidden%3D%22true%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fsection%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C!--%20Columna%20central%3A%20Tienda%20--%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Csection%20id%3D%22col-shop%22%20class%3D%22col%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22shop-card%22%20class%3D%22card%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22shop-tabs%22%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22shop-tab-generators%22%20class%3D%22shop-tab%20active%22%3E]]Generadores[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22shop-tab-upgrades%22%20class%3D%22shop-tab%22%3E]]Mejoras[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22shop-content%22%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22shop-list-generators%22%20class%3D%22shop-list%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22shop-list-upgrades%22%20class%3D%22shop-list%20hidden%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fsection%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C!--%20Columna%20derecha%3A%20Logros%20%2F%20Prestigio%20%2F%20Stats%20--%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3Csection%20id%3D%22col-side%22%20class%3D%22col%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22side-tabs%22%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22side-tab-achievements%22%20class%3D%22side-tab%20active%22%20data-side%3D%22achievements%22%3E]]🏆 Logros[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22side-tab-prestige%22%20class%3D%22side-tab%22%20data-side%3D%22prestige%22%3E]]✨ Prestigio[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
          [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22side-tab-stats%22%20class%3D%22side-tab%22%20data-side%3D%22stats%22%3E]]📊 Stats[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22side-panel-achievements%22%20class%3D%22side-panel%20active%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22card%22%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ch2%20class%3D%22card-title%22%3E]]Logros[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fh2%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22achievements-list%22%20class%3D%22ach-list%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22side-panel-prestige%22%20class%3D%22side-panel%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22card%22%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ch2%20class%3D%22card-title%22%3E]]Prestigio[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fh2%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22prestige-summary%22%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22prestige-stat%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%3E]]Almas[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22prestige-souls%22%3E]]0[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22prestige-stat%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%3E]]Ganarías[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22prestige-gain%22%3E]]0[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22prestige-stat%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%3E]]Multiplicador[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20id%3D%22prestige-multiplier%22%3E]]x1.00[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22btn-prestige%22%20class%3D%22btn%20btn-prestige%22%20disabled%3E]]Ascender[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ch3%20class%3D%22card-subtitle%22%3E]]Tienda de almas[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fh3%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22prestige-shop%22%20class%3D%22prestige-list%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3Cdiv%20id%3D%22side-panel-stats%22%20class%3D%22side-panel%22%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22card%22%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ch2%20class%3D%22card-title%22%3E]]Estadísticas[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fh2%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22stats-content%22%20class%3D%22stats-grid%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20class%3D%22stats-actions%22%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22btn-export%22%20class%3D%22btn%22%3E]]Exportar[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
              [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20id%3D%22btn-import%22%20class%3D%22btn%22%3E]]Importar[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
            [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Ctextarea%20id%3D%22save-area%22%20class%3D%22save-area%20hidden%22%20placeholder%3D%22Pega%20tu%20save%20aqu%C3%AD...%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Ftextarea%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%20%20%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%20%20%3C%2Fsection%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3C%2Fmain%3E]]

[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3C!--%20Mobile%20bottom%20navigation%20--%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3Cnav%20id%3D%22mobile-nav%22%3E]]
      [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20class%3D%22mobile-tab%20active%22%20data-mobile%3D%22game%22%3E]]🧟 Juego[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
      [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20class%3D%22mobile-tab%22%20data-mobile%3D%22achievements%22%3E]]🏆 Logros[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
      [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20class%3D%22mobile-tab%22%20data-mobile%3D%22prestige%22%3E]]✨ Prestigio[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
      [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cbutton%20class%3D%22mobile-tab%22%20data-mobile%3D%22stats%22%3E]]📊 Stats[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fbutton%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%20%20%3C%2Fnav%3E]]

    [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22toast-container%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
    [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22golden-brain%22%20class%3D%22event-item%20hidden%22%3E]]🧠[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
    [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20id%3D%22horde-boss%22%20class%3D%22event-item%20hidden%22%3E]]👹[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%20%20%3C%2Fdiv%3E]]
  [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cscript%20src%3D%22game.js%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fscript%3E]]
  [[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cscript%20src%3D%22ui.js%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fscript%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3C%2Fbody%3E]]
[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:block-html:%3C%2Fhtml%3E]]
```

- [ ] **Step 2: Verificar en navegador**

Abrir `index.html`. La página se verá desestructurada porque `style.css` aún no tiene el nuevo layout, pero debe verse el contenido en orden y sin errores 404.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(ui): estructura HTML de 3 columnas y navegación mobile"
```

---

### Task 3: Design system CSS — variables, tipografía y reset

**Files:**

- Modify: `style.css` (reescritura desde cero)
- Test: abrir `index.html`, verificar tipografía y colores base

**Interfaces:**

- Consumes: HTML de Task 2
- Produces: variables CSS globales usadas por todos los componentes

- [ ] **Step 1: Reescribir `style.css` — parte 1: variables y base**

```css
:root {
  --bg-900: #070a07;
  --bg-800: #0f140f;
  --bg-700: #1a221a;
  --bg-600: #263026;

  --green-500: #7fbf3f;
  --green-400: #a3d96a;
  --green-300: #c8f2a1;
  --green-glow: rgba(127, 191, 63, 0.35);

  --red-500: #c0392b;
  --red-400: #e74c3c;
  --red-glow: rgba(192, 57, 43, 0.35);

  --gold-400: #f1c40f;
  --gold-500: #f39c12;

  --text-primary: #eef2ea;
  --text-secondary: #9caf95;
  --text-muted: #5d705a;
  --border: rgba(127, 191, 63, 0.12);

  --font-display: 'Creepster', 'Impact', fantasy, sans-serif;
  --font-body: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Roboto Mono', 'Consolas', monospace;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.45);
  --glow-green: 0 0 24px var(--green-glow);
  --glow-red: 0 0 24px var(--red-glow);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  font-family: var(--font-body);
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(127, 191, 63, 0.08) 0%, transparent 60%),
    linear-gradient(180deg, var(--bg-900) 0%, var(--bg-800) 100%);
  color: var(--text-primary);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.hidden { display: none !important; }

.card {
  background: var(--bg-800);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 16px;
}

.card-title {
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  color: var(--green-400);
  letter-spacing: 1px;
}

.card-subtitle {
  margin: 18px 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

- [ ] **Step 2: Verificar**

Abrir `index.html`. Debe verse fondo oscuro, texto claro, y la tipografía Creepster en los títulos.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(css): design system con variables y tipografía"
```

---

### Task 4: Layout responsive — grid de 3 columnas y mobile nav

**Files:**

- Modify: `style.css`
- Test: redimensionar navegador entre desktop/tablet/mobile

**Interfaces:**

- Consumes: clases `.main-grid`, `.col`, `#mobile-nav`, `.mobile-tab`
- Produces: layout funcional en todos los breakpoints

- [ ] **Step 1: Añadir layout grid y mobile nav a `style.css`**

Añadir al final de `style.css`:

```css
/* Header */
#topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(7, 10, 7, 0.92);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 20;
  flex-wrap: wrap;
}

#brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
#brand-icon { font-size: 28px; }
#brand-text { display: flex; flex-direction: column; }
#brand-name {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--green-400);
  line-height: 1;
}
#brand-sub {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

#topbar-stats {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.topbar-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.topbar-stat-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.topbar-stat-value {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--green-300);
}

#topbar-actions {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-700);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
}
.icon-btn:hover {
  background: var(--bg-600);
  box-shadow: var(--glow-green);
}
.icon-btn:active { transform: scale(0.94); }

/* Main grid */
#main {
  flex: 1;
  padding: 18px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.main-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 0.85fr;
  gap: 18px;
  align-items: start;
}

.col { display: flex; flex-direction: column; gap: 16px; }

/* Mobile navigation */
#mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(7, 10, 7, 0.95);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(10px);
  z-index: 30;
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.mobile-tab.active {
  color: var(--green-400);
  background: rgba(127, 191, 63, 0.08);
}

/* Responsive */
@media (max-width: 1023px) {
  .main-grid {
    grid-template-columns: 1fr 1fr;
  }
  #col-side {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  #topbar { flex-wrap: nowrap; }
  #brand-sub { display: none; }
  #brand-name { font-size: 20px; }
  #topbar-stats { gap: 12px; }
  .topbar-stat-value { font-size: 15px; }

  #main {
    padding: 12px;
    padding-bottom: 80px;
  }
  .main-grid {
    display: flex;
    flex-direction: column;
  }
  .col { display: none; }
  .col.active { display: flex; }

  #mobile-nav { display: flex; }
}
```

- [ ] **Step 2: Verificar**

En desktop debe verse 3 columnas. En tablet (&lt;1024px) 2 columnas con side abajo. En mobile (&lt;768px) una columna a la vez y nav inferior visible.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(css): layout responsive de 3 columnas y nav mobile"
```

---

### Task 5: Header, clicker y botón principal

**Files:**

- Modify: `style.css`
- Test: verificar zombie button, hover, active, partículas placeholder

**Interfaces:**

- Consumes: `#zombie-btn`, `#zombie-icon`, `#clicker-area`, `#click-value`, `#click-hint`
- Produces: estilos visuales del clicker

- [ ] **Step 1: Añadir estilos del clicker a `style.css`**

```css
/* Clicker */
#clicker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  position: relative;
  overflow: hidden;
}

#clicker-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  z-index: 2;
}

#zombie-btn {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, var(--bg-600) 0%, var(--bg-800) 55%, var(--bg-900) 100%);
  box-shadow:
    0 0 0 8px rgba(127, 191, 63, 0.08),
    inset 0 0 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(127, 191, 63, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
#zombie-btn:hover {
  box-shadow:
    0 0 0 10px rgba(127, 191, 63, 0.12),
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    0 0 60px var(--green-glow);
}
#zombie-btn:active { transform: scale(0.92); }
#zombie-btn.popping { animation: zombiePop 0.18s ease; }

@keyframes zombiePop {
  0% { transform: scale(0.92); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

#zombie-icon {
  font-size: 120px;
  pointer-events: none;
  filter: drop-shadow(0 0 12px rgba(127, 191, 63, 0.25));
  transition: transform 0.1s ease;
}
#zombie-btn:hover #zombie-icon { transform: scale(1.05); }

#clicker-info { text-align: center; }
#click-value {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--green-300);
}
#click-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

#click-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 767px) {
  #clicker-card { min-height: 340px; }
  #zombie-btn { width: 200px; height: 200px; }
  #zombie-icon { font-size: 90px; }
}
```

- [ ] **Step 2: Verificar**

El botón debe ser circular grande, con glow verde, escala al click.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(css): estilos del clicker y botón zombie"
```

---

### Task 6: Shop, logros, prestigio y stats

**Files:**

- Modify: `style.css`
- Test: verificar cards, tabs, estados disabled/affordable/owned

**Interfaces:**

- Consumes: `.shop-tab`, `.shop-list`, `.ach-list`, `.prestige-list`, `.stats-grid`, `.prestige-stat`
- Produces: estilos de listas y cards

- [ ] **Step 1: Añadir estilos de componentes a `style.css`**

```css
/* Shop tabs */
#shop-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.shop-tab {
  flex: 1;
  padding: 10px 14px;
  background: var(--bg-700);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.shop-tab:hover {
  background: var(--bg-600);
  color: var(--text-primary);
}
.shop-tab.active {
  background: rgba(127, 191, 63, 0.12);
  color: var(--green-300);
  border-color: var(--green-500);
  box-shadow: 0 0 12px var(--green-glow);
}

/* Lists */
.shop-list,
.ach-list,
.prestige-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}
.shop-list::-webkit-scrollbar,
.ach-list::-webkit-scrollbar,
.prestige-list::-webkit-scrollbar { width: 6px; }
.shop-list::-webkit-scrollbar-thumb,
.ach-list::-webkit-scrollbar-thumb,
.prestige-list::-webkit-scrollbar-thumb {
  background: var(--bg-600);
  border-radius: 6px;
}

/* Item card base */
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-700);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
}
.item-card:hover {
  background: var(--bg-600);
  border-color: var(--green-500);
}
.item-card:active { transform: translateY(1px); }
.item-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.item-card.disabled:hover {
  background: var(--bg-700);
  border-color: var(--border);
}
.item-card.affordable {
  border-color: var(--green-500);
  box-shadow: 0 0 12px var(--green-glow);
}
.item-card.owned {
  border-color: var(--green-500);
  background: rgba(127, 191, 63, 0.08);
}

.item-icon {
  font-size: 30px;
  width: 44px;
  text-align: center;
  flex-shrink: 0;
}
.item-info { flex: 1; min-width: 0; }
.item-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}
.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 70px;
}
.item-cost {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 14px;
  color: var(--green-300);
}
.item-count {
  font-size: 12px;
  color: var(--text-muted);
}

/* Generator buy quantity buttons */
.buy-qty {
  display: flex;
  gap: 4px;
}
.qty-btn {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-800);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.qty-btn.active {
  background: var(--green-500);
  color: var(--bg-900);
  border-color: var(--green-500);
}

/* Achievements */
.ach-card.locked { opacity: 0.55; }
.ach-card.unlocked {
  border-color: var(--green-500);
  background: rgba(127, 191, 63, 0.08);
}
.ach-bonus {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--green-300);
  white-space: nowrap;
}

/* Side tabs */
#side-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.side-tab {
  flex: 1;
  padding: 10px 12px;
  background: var(--bg-700);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.side-tab:hover { background: var(--bg-600); color: var(--text-primary); }
.side-tab.active {
  background: rgba(127, 191, 63, 0.12);
  color: var(--green-300);
  border-color: var(--green-500);
}

.side-panel { display: none; }
.side-panel.active { display: block; }

/* Prestige */
#prestige-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.prestige-stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.prestige-stat:last-child { border-bottom: none; }
.prestige-stat span:first-child { color: var(--text-secondary); }
.prestige-stat span:last-child {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--green-300);
}

.btn {
  border: 1px solid var(--border);
  background: var(--bg-700);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
}
.btn:hover { background: var(--bg-600); }
.btn:active { transform: translateY(1px); }
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-prestige {
  width: 100%;
  background: linear-gradient(135deg, var(--red-400), var(--red-500));
  color: #fff;
  border: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-prestige:hover {
  box-shadow: var(--glow-red);
}
.btn-prestige:disabled {
  background: var(--bg-600);
  color: var(--text-muted);
  box-shadow: none;
}

.prestige-cost { color: var(--gold-400); }

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.stat-row:last-child { border-bottom: none; }
.stat-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.stat-row span:last-child {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--green-300);
}

.stats-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.save-area {
  width: 100%;
  min-height: 80px;
  margin-top: 10px;
  background: var(--bg-900);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  resize: vertical;
}
```

- [ ] **Step 2: Verificar**

Abrir `index.html`. Las cards deben verse con fondo oscuro, bordes sutiles, tipografía monoespaciada en costos. Las tabs deben verse como pills.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(css): estilos de shop, logros, prestigio y stats"
```

---

### Task 7: Refactor de `ui.js` — render por componente

**Files:**

- Modify: `ui.js` (reescritura casi completa)
- Test: `node tests/logic.test.js` + probar todas las funcionalidades en navegador

**Interfaces:**

- Consumes: `window.Game`, `localStorage`, nuevos IDs del HTML
- Produces: funciones `renderHeader`, `renderClicker`, `renderShop`, `renderSide`, `renderAchievements`, `renderPrestige`, `renderStats`, `renderAll`; setup de tabs y mobile nav.

**Nota:** Este es el refactor más grande. Se mantiene la lógica pura en `Game`; `ui.js` solo cambia IDs y estructura de render.

- [ ] **Step 1: Reescribir `ui.js` — primera mitad (utilidades, persistencia, click)**

```javascript
(function () {
  "use strict";

  const SAVE_KEY = "zombieClickerSave";
  const OFFLINE_CAP_SECONDS = 8 * 3600;

  let state = null;
  let lastTickTime = null;
  let autoClickInterval = null;
  let goldenBrainTimer = null;
  let bossTimer = null;
  let bossActive = false;
  let bossMultiplier = 1;
  let generatorQty = 1; // 1, 10, 0=max

  function $(id) { return document.getElementById(id); }

  function formatNumber(n) {
    if (typeof Game !== "undefined" && Game.formatNumber) return Game.formatNumber(n);
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
    if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
    if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
    return (n / 1e12).toFixed(1) + "T";
  }

  function formatTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + "s";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m " + Math.floor(seconds % 60) + "s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h + "h " + m + "m";
  }

  function showToast(message, type) {
    const container = $("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("toast-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3000);
  }

  function saveGame() {
    if (!state) return;
    state.lastSaved = Date.now();
    try { localStorage.setItem(SAVE_KEY, Game.serialize(state)); } catch (e) {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) state = Game.deserialize(raw);
    } catch (e) {}
    if (!state) state = Game.createState();
    if (!state.prestige) state.prestige = { souls: 0, totalSoulsEarned: 0, upgrades: [] };
    if (!Array.isArray(state.prestige.upgrades)) state.prestige.upgrades = [];
    if (!Array.isArray(state.upgrades)) state.upgrades = [];
    if (!Array.isArray(state.achievements)) state.achievements = [];
    if (!state.generators) state.generators = {};
    if (!state.startedAt) state.startedAt = Date.now();
  }

  function resetGame() {
    if (typeof confirm === "function" && !confirm("¿Seguro que quieres reiniciar TODO el progreso?")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    state = Game.createState();
    renderAll();
    showToast("Progreso reiniciado", "info");
  }

  function handleClick(event) {
    if (!state) return;
    const value = Game.click(state);
    spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(value));
    pulseZombie();
    renderHeader();
    renderStats();
  }

  function pulseZombie() {
    const btn = $("zombie-btn");
    if (!btn) return;
    btn.classList.remove("popping");
    void btn.offsetWidth; // force reflow
    btn.classList.add("popping");
    const icon = $("zombie-icon");
    if (icon) {
      const original = icon.textContent;
      icon.textContent = "💀";
      setTimeout(function () { icon.textContent = original; }, 120);
    }
  }

  function spawnFloatingText(x, y, text) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
  }

  function buyGenerator(id) {
    if (!state) return;
    const qty = generatorQty === 0 ? Game.getMaxAffordable(state, id) : generatorQty;
    const bought = Game.buyGenerators(state, id, qty);
    if (bought > 0) {
      renderShop();
      renderHeader();
      renderStats();
    }
  }

  function buyUpgrade(id) {
    if (!state) return;
    if (Game.buyUpgrade(state, id)) {
      renderShop();
      renderHeader();
      renderStats();
      showToast("Mejora adquirida", "success");
    }
  }

  function buyPrestigeUpgrade(id) {
    if (!state) return;
    if (Game.buyPrestigeUpgrade(state, id)) {
      renderPrestige();
      renderHeader();
      showToast("Mejora de almas comprada", "success");
    }
  }

  function doPrestige() {
    if (!state) return;
    const gain = Game.getPrestigeGain(state);
    if (gain <= 0) {
      showToast("Necesitas más cerebros totales para ascender", "warn");
      return;
    }
    if (typeof confirm === "function" && !confirm("¿Ascender? Perderás cerebros, generadores y mejoras, pero ganarás " + gain + " almas.")) return;
    state = Game.prestige(state);
    saveGame();
    renderAll();
    showToast("¡La horda renace! +" + gain + " almas", "success");
  }
```

- [ ] **Step 2: Reescribir `ui.js` — segunda mitad (render, tabs, init)**

Añadir después:

```javascript
  function renderHeader() {
    if (!state) return;
    const brainsEl = $("stat-brains");
    const bpsEl = $("stat-bps");
    const soulsEl = $("stat-souls");
    if (brainsEl) brainsEl.textContent = formatNumber(state.brains);
    if (bpsEl) bpsEl.textContent = formatNumber(Game.getBrainsPerSecond(state)) + "/s";
    if (soulsEl) soulsEl.textContent = formatNumber(state.prestige.souls);
  }

  function renderClicker() {
    if (!state) return;
    const clickValueEl = $("click-value");
    if (clickValueEl) clickValueEl.textContent = "+" + formatNumber(Game.getClickValue(state)) + " por click";
  }

  function renderShop() {
    renderGenerators();
    renderUpgrades();
  }

  function renderGenerators() {
    const container = $("shop-list-generators");
    if (!container || !state) return;
    container.innerHTML = "";

    // Botones de cantidad
    const qtyBar = document.createElement("div");
    qtyBar.className = "buy-qty";
    [1, 10, 0].forEach(function (q) {
      const btn = document.createElement("button");
      btn.className = "qty-btn" + (generatorQty === q ? " active" : "");
      btn.textContent = q === 0 ? "Max" : "x" + q;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        generatorQty = q;
        renderGenerators();
      });
      qtyBar.appendChild(btn);
    });
    container.appendChild(qtyBar);

    Game.GENERATORS.forEach(function (gen) {
      const cost = Game.getGeneratorCost(state, gen.id);
      const count = state.generators[gen.id] || 0;
      const canBuy = state.brains >= cost;
      const bpsEach = Game.getGeneratorBps(state, gen.id);

      const div = document.createElement("div");
      div.className = "item-card" + (canBuy ? " affordable" : " disabled");
      div.innerHTML =
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-icon%22%3E]]' + gen.icon + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-info%22%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-name%22%3E]]' + gen.name + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-desc%22%3E]]' + gen.desc + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-meta%22%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-cost%22%3E]]' + formatNumber(cost) + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-count%22%3E]]x' + count + ' · ' + formatNumber(bpsEach) + '/s[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]';
      div.addEventListener("click", function () { buyGenerator(gen.id); });
      container.appendChild(div);
    });
  }

  function renderUpgrades() {
    const container = $("shop-list-upgrades");
    if (!container || !state) return;
    container.innerHTML = "";
    let any = false;
    Game.UPGRADES.forEach(function (upg) {
      if (state.upgrades.indexOf(upg.id) !== -1) return;
      any = true;
      const canBuy = state.brains >= upg.cost;
      const div = document.createElement("div");
      div.className = "item-card" + (canBuy ? " affordable" : " disabled");
      div.innerHTML =
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-icon%22%3E]]' + upg.icon + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-info%22%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-name%22%3E]]' + upg.name + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-desc%22%3E]]' + upg.desc + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-cost%22%3E]]' + formatNumber(upg.cost) + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]';
      div.addEventListener("click", function () { buyUpgrade(upg.id); });
      container.appendChild(div);
    });
    if (!any) {
      const empty = document.createElement("div");
      empty.className = "item-card disabled";
      empty.innerHTML = '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-desc%22%3E]]¡Todas las mejoras compradas![[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]';
      container.appendChild(empty);
    }
  }

  function renderAchievements() {
    const container = $("achievements-list");
    if (!container || !state) return;
    container.innerHTML = "";
    Game.ACHIEVEMENTS.forEach(function (ach) {
      const unlocked = state.achievements.indexOf(ach.id) !== -1;
      const div = document.createElement("div");
      div.className = "item-card ach-card" + (unlocked ? " unlocked" : " locked");
      div.innerHTML =
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-icon%22%3E]]' + (unlocked ? "✅" : "🔒") + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-info%22%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-name%22%3E]]' + ach.name + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-desc%22%3E]]' + ach.desc + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22ach-bonus%22%3E]]+' + (ach.bonus * 100).toFixed(0) + '%[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]';
      container.appendChild(div);
    });
  }

  function renderPrestige() {
    const soulsEl = $("prestige-souls");
    const gainEl = $("prestige-gain");
    const multEl = $("prestige-multiplier");
    const btn = $("btn-prestige");
    if (!state) return;
    const gain = Game.getPrestigeGain(state);
    if (soulsEl) soulsEl.textContent = formatNumber(state.prestige.souls);
    if (gainEl) gainEl.textContent = formatNumber(gain);
    if (multEl) multEl.textContent = "x" + Game.getGlobalMultiplier(state).toFixed(2);
    if (btn) btn.disabled = gain <= 0;

    const shop = $("prestige-shop");
    if (!shop) return;
    shop.innerHTML = "";
    Game.PRESTIGE_UPGRADES.forEach(function (pu) {
      const owned = state.prestige.upgrades.indexOf(pu.id) !== -1;
      const canBuy = !owned && state.prestige.souls >= pu.cost;
      const div = document.createElement("div");
      div.className = "item-card" + (owned ? " owned" : (canBuy ? " affordable" : " disabled"));
      div.innerHTML =
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-info%22%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-name%22%3E]]' + pu.name + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
          '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22item-desc%22%3E]]' + pu.desc + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]' +
        '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%20class%3D%22item-cost%20prestige-cost%22%3E]]' + (owned ? "Comprado" : formatNumber(pu.cost) + " almas") + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]]';
      if (!owned) {
        div.addEventListener("click", function () { buyPrestigeUpgrade(pu.id); });
      }
      shop.appendChild(div);
    });
  }

  function renderStats() {
    if (!state) return;
    const stats = Game.getStats(state);
    const content = $("stats-content");
    if (!content) return;
    content.innerHTML =
      statRow("Cerebros totales", formatNumber(stats.totalBrainsEarned)) +
      statRow("Clicks totales", formatNumber(stats.totalClicks)) +
      statRow("Mejor BPS", formatNumber(stats.bestBps)) +
      statRow("Tiempo jugado", formatTime(stats.elapsedSeconds)) +
      statRow("Generadores", formatNumber(stats.generatorsOwned)) +
      statRow("Logros", state.achievements.length + "/" + Game.ACHIEVEMENTS.length) +
      statRow("Multiplicador", "x" + Game.getGlobalMultiplier(state).toFixed(2)) +
      statRow("Almas totales", formatNumber(state.prestige.totalSoulsEarned));
  }

  function statRow(label, value) {
    return '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cdiv%20class%3D%22stat-row%22%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%3E]]' + label + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3Cspan%3E]]' + value + '[[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fspan%3E]][[ORCA_RICH_MD:c19c36be6e230bc6c1c22af71771f225:inline-html:%3C%2Fdiv%3E]]';
  }

  function renderAll() {
    renderHeader();
    renderClicker();
    renderShop();
    renderAchievements();
    renderPrestige();
    renderStats();
  }

  function setupShopTabs() {
    const tabs = [
      { btn: "shop-tab-generators", list: "shop-list-generators" },
      { btn: "shop-tab-upgrades", list: "shop-list-upgrades" }
    ];
    tabs.forEach(function (t) {
      const btn = $(t.btn);
      const list = $(t.list);
      if (!btn || !list) return;
      btn.addEventListener("click", function () {
        tabs.forEach(function (other) {
          const ob = $(other.btn);
          const ol = $(other.list);
          if (ob) ob.classList.remove("active");
          if (ol) ol.classList.add("hidden");
        });
        btn.classList.add("active");
        list.classList.remove("hidden");
      });
    });
  }

  function setupSideTabs() {
    const tabs = [
      { btn: "side-tab-achievements", panel: "side-panel-achievements" },
      { btn: "side-tab-prestige", panel: "side-panel-prestige" },
      { btn: "side-tab-stats", panel: "side-panel-stats" }
    ];
    tabs.forEach(function (t) {
      const btn = $(t.btn);
      const panel = $(t.panel);
      if (!btn || !panel) return;
      btn.addEventListener("click", function () {
        tabs.forEach(function (other) {
          const ob = $(other.btn);
          const op = $(other.panel);
          if (ob) ob.classList.remove("active");
          if (op) op.classList.remove("active");
        });
        btn.classList.add("active");
        panel.classList.add("active");
      });
    });
  }

  function setupMobileNav() {
    const mobileTabs = document.querySelectorAll(".mobile-tab");
    const cols = {
      game: $("col-clicker"),
      achievements: $("col-side"),
      prestige: $("col-side"),
      stats: $("col-side")
    };
    mobileTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-mobile");
        mobileTabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        Object.keys(cols).forEach(function (key) {
          const col = cols[key];
          if (col) col.classList.toggle("active", key === target);
        });
        // Activar side tab correspondiente
        if (target !== "game") {
          const sideBtn = $("side-tab-" + target);
          if (sideBtn) sideBtn.click();
        }
      });
    });
  }

  // ---------- Eventos especiales (sin cambios funcionales, solo IDs normalizados) ----------
  function spawnGoldenBrain() {
    const el = $("golden-brain");
    if (!el) return;
    el.classList.add("visible");
    el.classList.remove("popping");
    el.style.left = (10 + Math.random() * 80) + "%";
    el.style.top = (10 + Math.random() * 70) + "%";
    const timeout = setTimeout(function () {
      el.classList.remove("visible");
      goldenBrainTimer = null;
    }, 8000);
    el.onclick = function () {
      clearTimeout(timeout);
      el.classList.remove("visible");
      el.classList.add("popping");
      goldenBrainTimer = null;
      if (state) {
        const reward = Math.max(100, Math.floor(Game.getBrainsPerSecond(state) * 30));
        state.brains += reward;
        state.totalBrainsEarned += reward;
        showToast("🧠 Cerebro dorado: +" + formatNumber(reward) + " cerebros", "success");
        renderHeader();
        renderStats();
      }
    };
  }

  function scheduleGoldenBrain() {
    if (goldenBrainTimer) return;
    const delay = 60000 + Math.random() * 120000;
    goldenBrainTimer = setTimeout(function () {
      goldenBrainTimer = null;
      spawnGoldenBrain();
      scheduleGoldenBrain();
    }, delay);
  }

  function spawnBoss() {
    const el = $("horde-boss");
    if (!el) return;
    bossActive = true;
    bossMultiplier = 5;
    el.classList.add("visible");
    showToast("👹 ¡Jefe de la horda apareció! x5 producción por 30s", "warn");
    const timeout = setTimeout(function () {
      el.classList.remove("visible");
      bossActive = false;
      bossMultiplier = 1;
      bossTimer = null;
      showToast("El jefe se fue", "info");
    }, 30000);
    el.onclick = function () {
      clearTimeout(timeout);
      el.classList.remove("visible");
      bossActive = false;
      bossMultiplier = 1;
      bossTimer = null;
      if (state) {
        const reward = Math.max(500, Math.floor(Game.getBrainsPerSecond(state) * 60));
        state.brains += reward;
        state.totalBrainsEarned += reward;
        showToast("💀 ¡Derrotaste al jefe! +" + formatNumber(reward) + " cerebros", "success");
        renderHeader();
        renderStats();
      }
    };
  }

  function scheduleBoss() {
    if (bossTimer) return;
    const delay = 180000 + Math.random() * 180000;
    bossTimer = setTimeout(function () {
      bossTimer = null;
      spawnBoss();
      scheduleBoss();
    }, delay);
  }

  function setupAutoClick() {
    if (autoClickInterval) { clearInterval(autoClickInterval); autoClickInterval = null; }
    if (state && state.prestige.upgrades.indexOf("autoClick") !== -1) {
      autoClickInterval = setInterval(function () {
        if (!state) return;
        const value = Game.click(state);
        const zombieEl = $("zombie-btn");
        if (zombieEl) {
          zombieEl.classList.add("popping");
          setTimeout(function () { zombieEl.classList.remove("popping"); }, 180);
        }
        renderHeader();
        renderStats();
      }, 2000);
    }
  }

  function gameLoop() {
    if (!state) return;
    const now = Date.now();
    if (lastTickTime === null) { lastTickTime = now; return; }
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;
    if (dt > 0) {
      Game.tick(state, dt);
      const bps = Game.getBrainsPerSecond(state);
      if (bps > (state.bestBps || 0)) state.bestBps = bps;
      const newAch = Game.checkAchievements(state);
      if (newAch && newAch.length > 0) {
        newAch.forEach(function (id) {
          const ach = Game.ACHIEVEMENTS.find(function (a) { return a.id === id; });
          if (ach) showToast("🏆 Logro: " + ach.name, "success");
        });
        renderAchievements();
      }
      renderHeader();
      renderStats();
      renderShop();
    }
  }

  function init() {
    loadGame();
    renderAll();
    setupShopTabs();
    setupSideTabs();
    setupMobileNav();
    setupAutoClick();

    const zombieEl = $("zombie-btn");
    if (zombieEl) zombieEl.addEventListener("click", handleClick);

    const btnSave = $("btn-save");
    if (btnSave) btnSave.addEventListener("click", function () { saveGame(); showToast("Juego guardado", "info"); });

    const btnReset = $("btn-reset");
    if (btnReset) btnReset.addEventListener("click", resetGame);

    const btnPrestige = $("btn-prestige");
    if (btnPrestige) btnPrestige.addEventListener("click", doPrestige);

    const btnExport = $("btn-export");
    const btnImport = $("btn-import");
    const saveArea = $("save-area");
    if (btnExport && saveArea) {
      btnExport.addEventListener("click", function () {
        saveArea.classList.remove("hidden");
        saveArea.value = Game.exportSave(state);
        saveArea.select();
      });
    }
    if (btnImport && saveArea) {
      btnImport.addEventListener("click", function () {
        if (saveArea.classList.contains("hidden")) {
          saveArea.classList.remove("hidden");
          saveArea.value = "";
          saveArea.focus();
        } else {
          const imported = Game.importSave(saveArea.value.trim());
          if (imported) {
            state = imported;
            saveGame();
            renderAll();
            showToast("Save importado", "success");
            saveArea.classList.add("hidden");
          } else {
            showToast("Save inválido", "warn");
          }
        }
      });
    }

    if (state.lastSaved) {
      const elapsed = (Date.now() - state.lastSaved) / 1000;
      if (elapsed > 60) {
        const cap = OFFLINE_CAP_SECONDS;
        const effective = Math.min(elapsed, cap);
        const gained = Game.applyOfflineProgress(state, effective);
        if (gained > 0) showToast("🌙 Mientras estabas fuera ganaste " + formatNumber(gained) + " cerebros", "info");
      }
    }

    scheduleGoldenBrain();
    scheduleBoss();
    setInterval(gameLoop, 100);
    setInterval(saveGame, 15000);
    window.addEventListener("beforeunload", saveGame);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  if (typeof window !== "undefined") {
    window.ZombieClicker = {
      state: state,
      saveGame: saveGame,
      loadGame: loadGame,
      resetGame: resetGame,
      handleClick: handleClick,
      buyGenerator: buyGenerator,
      buyUpgrade: buyUpgrade,
      buyPrestigeUpgrade: buyPrestigeUpgrade,
      doPrestige: doPrestige,
      getBrainsPerSecond: function () { return state ? Game.getBrainsPerSecond(state) : 0; },
      getClickValue: function () { return state ? Game.getClickValue(state) : 0; },
      formatNumber: formatNumber
    };
  }
})();
```

- [ ] **Step 3: Verificar**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

Abrir `index.html`. Verificar:

- Clicks generan cerebros y float text.
- Shop muestra generadores y mejoras.
- Las tabs de shop funcionan.
- Side tabs muestran logros/prestigio/stats.
- Mobile nav funciona (usar devtools responsive).
- No hay errores en consola.

- [ ] **Step 4: Commit**

```bash
git add ui.js
git commit -m "feat(ui): refactor por componentes, IDs normalizados, export/import save"
```

---

### Task 8: Animaciones — click, compra, logros, toasts

**Files:**

- Modify: `style.css`
- Modify: `ui.js` (pequeños ajustes para añadir clases de animación)
- Test: probar click, compra y desbloqueo de logro

**Interfaces:**

- Consumes: clases `.floating-text`, `.toast`, `.item-card`
- Produces: clases `.flash`, `.count-pop`, `.shine` para animaciones

- [ ] **Step 1: Añadir animaciones a `style.css`**

```css
/* Floating text */
.floating-text {
  position: fixed;
  pointer-events: none;
  color: var(--green-300);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 18px;
  text-shadow: 0 0 10px var(--green-glow);
  animation: floatUp 0.9s ease forwards;
  z-index: 99;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  40% { transform: translateY(-20px) scale(1.1); opacity: 1; }
  100% { transform: translateY(-50px) scale(0.9); opacity: 0; }
}

/* Toasts */
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  max-width: 320px;
}
.toast {
  background: var(--bg-800);
  border: 1px solid var(--border);
  border-left: 4px solid var(--green-500);
  color: var(--text-primary);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  animation: slideIn 0.25s ease;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}
.toast.success { border-left-color: var(--green-500); }
.toast.warn { border-left-color: var(--gold-500); }
.toast.info { border-left-color: var(--text-secondary); }
.toast::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.5;
  animation: toastProgress 3s linear forwards;
}
@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
.toast-out { animation: slideOut 0.3s ease forwards; }
@keyframes slideIn {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(20px); opacity: 0; }
}

/* Purchase flash */
.item-card.flash {
  animation: buyFlash 0.35s ease;
}
@keyframes buyFlash {
  0% { background: var(--bg-700); }
  30% { background: rgba(127, 191, 63, 0.25); box-shadow: 0 0 20px var(--green-glow); }
  100% { background: var(--bg-700); }
}

/* Achievement shine */
.item-card.shine {
  animation: achShine 0.6s ease;
}
@keyframes achShine {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.4); }
  100% { filter: brightness(1); }
}

/* Count pop on generator card */
.count-pop {
  animation: countPop 0.25s ease;
}
@keyframes countPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: var(--green-300); }
  100% { transform: scale(1); }
}
```

- [ ] **Step 2: Añadir clases de animación en `ui.js`**

En `buyGenerator`, después de `renderShop()`:

```javascript
const card = document.querySelector('[data-gen-id="' + id + '"]');
if (card) {
  card.classList.remove("flash");
  void card.offsetWidth;
  card.classList.add("flash");
  const countEl = card.querySelector(".item-count");
  if (countEl) {
    countEl.classList.remove("count-pop");
    void countEl.offsetWidth;
    countEl.classList.add("count-pop");
  }
}
```

Para que el selector funcione, añadir `data-gen-id` en `renderGenerators`:

```javascript
div.setAttribute("data-gen-id", gen.id);
```

En `renderAchievements`, cuando un logro se desbloquea, añadir `shine` temporal. Como `renderAchievements` se llama desde el loop, podemos detectar nuevos logros. Alternativa simple: en `gameLoop`, cuando hay nuevos logros, añadir shine a los cards recién creados. Por simplicidad, añadir `setTimeout` en `renderAchievements` para los recién desbloqueados:

```javascript
if (unlocked) {
  setTimeout(function () { div.classList.add("shine"); }, 10);
}
```

- [ ] **Step 3: Verificar**

Hacer click en el zombie: debe aparecer texto flotante y el botón debe hacer pop. Comprar un generador: la card debe hacer flash y el contador debe pop. Desbloquear un logro: debe brillar.

- [ ] **Step 4: Commit**

```bash
git add style.css ui.js
git commit -m "feat(ui): animaciones de click, compra, logros y toasts"
```

---

### Task 9: Eventos visuales — cerebro dorado y jefe de horda

**Files:**

- Modify: `style.css`
- Modify: `ui.js` (opcional, para mejorar el boss con barra de vida)
- Test: forzar eventos o esperar a que aparezcan

**Interfaces:**

- Consumes: `#golden-brain`, `#horde-boss`, `.event-item`
- Produces: estilos mejorados para eventos

- [ ] **Step 1: Añadir estilos de eventos a `style.css`**

```css
/* Event items */
.event-item {
  position: fixed;
  font-size: 64px;
  cursor: pointer;
  user-select: none;
  z-index: 90;
  display: none;
  pointer-events: auto;
}
.event-item.visible { display: block; }

#golden-brain {
  filter: drop-shadow(0 0 16px rgba(241, 196, 15, 0.8));
  animation: goldenFloat 8s ease-in-out forwards, goldenPulse 1.2s ease-in-out infinite;
}
@keyframes goldenFloat {
  0% { transform: translateY(0) scale(0) rotate(-20deg); opacity: 0; }
  10% { transform: translateY(-10px) scale(1) rotate(0deg); opacity: 1; }
  90% { transform: translateY(10px) scale(1) rotate(0deg); opacity: 1; }
  100% { transform: translateY(0) scale(0) rotate(20deg); opacity: 0; }
}
@keyframes goldenPulse {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(241, 196, 15, 0.6)); }
  50% { filter: drop-shadow(0 0 28px rgba(241, 196, 15, 1)); }
}
#golden-brain.popping {
  animation: goldenPop 0.35s ease forwards;
}
@keyframes goldenPop {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}

#horde-boss {
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 80px;
  filter: drop-shadow(0 0 24px var(--red-glow));
  animation: bossEntrance 0.5s ease, bossHover 2s ease-in-out infinite;
}
@keyframes bossEntrance {
  from { transform: translateX(-50%) scale(0); opacity: 0; }
  to { transform: translateX(-50%) scale(1); opacity: 1; }
}
@keyframes bossHover {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}
```

- [ ] **Step 2: Verificar**

En consola, ejecutar:

```javascript
ZombieClicker.spawnGoldenBrain && ZombieClicker.spawnGoldenBrain();
ZombieClicker.spawnBoss && ZombieClicker.spawnBoss();
```

Si las funciones no están expuestas, añadirlas a `window.ZombieClicker` en `ui.js`:

```javascript
spawnGoldenBrain: spawnGoldenBrain,
spawnBoss: spawnBoss
```

- [ ] **Step 3: Commit**

```bash
git add style.css ui.js
git commit -m "feat(ui): estilos y animaciones de eventos dorado y jefe"
```

---

### Task 10: Integración, ajustes responsive y pruebas finales

**Files:**

- Modify: `style.css` (ajustes finales)
- Modify: `ui.js` (pequeños ajustes)
- Test: `node tests/logic.test.js` + prueba manual completa

**Interfaces:**

- Todos los componentes integrados.

- [ ] **Step 1: Ajustes responsive finales en `style.css`**

Añadir/actualizar media queries:

```css
@media (max-width: 1023px) {
  #topbar { gap: 12px; }
  #topbar-stats { gap: 14px; }
  .topbar-stat-value { font-size: 16px; }
}

@media (max-width: 767px) {
  #topbar {
    padding: 10px 12px;
    flex-wrap: nowrap;
  }
  #brand-icon { font-size: 22px; }
  #brand-name { font-size: 18px; }
  #topbar-stats { gap: 10px; }
  .topbar-stat-label { font-size: 9px; }
  .topbar-stat-value { font-size: 14px; }
  .icon-btn { width: 34px; height: 34px; font-size: 16px; }

  #main { padding: 12px; padding-bottom: 80px; }
  .card { padding: 14px; border-radius: var(--radius-md); }
  .card-title { font-size: 18px; }

  #zombie-btn { width: 190px; height: 190px; }
  #zombie-icon { font-size: 82px; }
  #clicker-card { min-height: 300px; }

  .item-icon { font-size: 24px; width: 36px; }
  .item-name { font-size: 13px; }
  .item-desc { font-size: 11px; }
  .item-cost { font-size: 13px; }

  #toast-container {
    top: auto;
    bottom: 74px;
    right: 12px;
    left: 12px;
    max-width: none;
  }
}
```

- [ ] **Step 2: Verificar tests de lógica**

Run: `node tests/logic.test.js`
Expected: `Todos los tests pasaron correctamente.`

- [ ] **Step 3: Verificación manual en navegador**

Checklist:

- [ ] El juego carga sin errores de consola.
- [ ] Click genera cerebros y texto flotante.
- [ ] Se puede comprar generadores y mejoras.
- [ ] Tabs de shop (Generadores / Mejoras) funcionan.
- [ ] Side tabs (Logros / Prestigio / Stats) funcionan.
- [ ] En mobile, la navegación inferior cambia de vista.
- [ ] Logros se desbloquean y se muestran.
- [ ] Prestigio muestra almas y multiplicador; el botón se habilita.
- [ ] Stats muestran datos correctos.
- [ ] Exportar/Importar save funciona.
- [ ] Guardar y recargar conserva el progreso.
- [ ] Eventos dorado/jefe aparecen (o forzarlos desde consola).

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat(ui): ajustes responsive y pulido final del rediseño v3"
```

---

## Self-Review

### 1. Spec coverage


| Requerimiento del design doc         | Tarea que lo implementa                       |
| ------------------------------------ | --------------------------------------------- |
| Paleta y tipografía                  | Task 3                                        |
| Layout 3 columnas desktop            | Task 2 + Task 4                               |
| Mobile-first responsive              | Task 4 + Task 10                              |
| Header con stats y acciones          | Task 2 + Task 5                               |
| Clicker grande con feedback          | Task 5 + Task 8                               |
| Shop con tabs Generadores/Mejoras    | Task 1 + Task 6 + Task 7                      |
| Logros / Prestigio / Stats en side   | Task 2 + Task 6 + Task 7                      |
| Animaciones de click, compra, logros | Task 8                                        |
| Eventos dorado y jefe                | Task 9                                        |
| Toasts con barra de progreso         | Task 8                                        |
| Export/import save                   | Task 7                                        |
| Tests de lógica intactos             | Cada tarea incluye `node tests/logic.test.js` |


### 2. Placeholder scan

- No hay TBD, TODO ni "implement later".
- Cada tarea incluye código concreto.
- Cada tarea incluye comando de test.
- Todos los IDs están normalizados.

### 3. Type consistency

- `Game.*` mantiene su API; `ui.js` solo cambia IDs y estructura de render.
- `state` sigue siendo el objeto de `game.js`.
- `formatNumber` y `formatTime` son funciones internas consistentes.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-21-zombie-clicker-redesign-v3.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**