# Zombie Clicker — Cómo jugar

## ¿Qué es?

**Zombie Clicker** es un juego *clicker incremental* de temática zombie. Tu objetivo es acumular **cerebros** haciendo click en un zombie y comprando **generadores** y **mejoras** que produzcan cerebros automáticamente. Con el tiempo podés **prestigiar** para subir el nivel de Almas y ganar **astillas**. Los **huesos** se acumulan con eventos; todavía no se gastan.

Hecho en HTML/CSS/JS vanilla. Abrí `index.html` en tu navegador y jugá.

> El progreso se guarda automáticamente en `localStorage` cada 15 segundos y al cerrar la pestaña.

## Mecánicas principales

### Click
- Hacé click en el **zombie** para ganar cerebros.
- El valor de cada click se multiplica con upgrades de click, el **multiplicador global** y el prestige **Click Boost** (solo click, no BPS).
- Debajo del zombie se ven tus stats de click: **valor por click**, **% de crítico** y los **cerebros que da un crítico**.

### Generadores
- 15 tipos. Cada compra sube el costo un **15%**.
- **Hitos gratis:** a las 25, 50, 100, 200 y 400 unidades, ese generador duplica su BPS.
- Compra x1 / x10 / Max.

### Mejoras
- Se compran con cerebros y tienen **hasta 5 niveles** cada una.
- Cada nivel potencia click, un generador, el multiplicador global, críticos o costos más baratos.
- El costo sube un **×2.5** por nivel. La carta muestra `Lv N/5` y una barra hacia el próximo costo.
- Al llegar a nivel máximo se marca **MÁX** y queda visible.
- Al prestigiar se reinician (las de prestigio / almas no).

### Logros
- Se desbloquean solos. Cada uno suma **+2%** al multiplicador global.

### Prestigio: Almas vs astillas
Al **Ascender** reiniciás cerebros, generadores y mejoras de **esta run**.

- **Almas (nivel):** permanentes. No se gastan. Cada una → **+5%** multiplicador global.
- **Astillas:** se ganan igual que las almas al ascender, y **sí** se gastan en la tienda de prestige y en cosméticos.
- Fórmula de la run: `floor(sqrt(cerebrosDeLaRun / 1e9))` — la primera alma pide 1.000 millones de cerebros de esta vida.
- Consejo: conviene ascender cuando puedas **duplicar tu nivel** de almas.

En la tienda, pestaña **Almas**, podés gastar **astillas** en mejoras permanentes:
  - **BPS Boost**: +10% BPS
  - **Click Boost**: +20% click (no BPS)
  - **Soul Start**: +100 cerebros iniciales tras reset
  - **Offline Boost**: +50% cap de offline
  - **Cheaper Generators**: -10% costo
  - **Auto Click**: click automático cada 2 segundos

### Huesos
- Caen del cerebro dorado (a veces) y al **matar** al jefe de la horda (clicks a su barra de vida).
- Persisten al prestigiar. Aún no hay tienda de huesos.

### Cosméticos
- Vanity (no cambian BPS). Se pagan con **astillas**. Persisten al prestigiar.

### Progreso offline
- Hasta **8 horas** de BPS. El upgrade **Offline Boost** sube ese tope un 50% por compra.

### Eventos
- **Cerebro dorado:** cada 1–3 minutos. Cerebros instantáneos o, a veces, un hueso.
- **Jefe de la horda:** cada 3–6 minutos. Clickalo para bajarle la vida; al matarlo da cerebros y un hueso. Si se va, no hay premio.

## Generadores (15)

| # | Nombre | Costo base | BPS |
|---|--------|------------|-----|
| 1 | Superviviente asustado | 15 | 0.1 |
| 2 | Mordedor | 100 | 1 |
| 3 | Corredor | 1,100 | 8 |
| 4 | Rabioso | 12,000 | 47 |
| 5 | Jefe zombie | 130,000 | 260 |
| 6 | Horda | 1,400,000 | 1,400 |
| 7 | Necrópolis | 15,000,000 | 7,800 |
| 8 | Virus Alfa | 200,000,000 | 44,000 |
| 9 | Apocalipsis | 3,300,000,000 | 260,000 |
| 10 | Zombie Dios | 51,000,000,000 | 1,500,000 |
| 11 | Cementerio infinito | 7.5e11 | 8.5e6 |
| 12 | Plaga mundial | 1.1e13 | 5.0e7 |
| 13 | Dimensión rota | 1.6e14 | 2.8e8 |
| 14 | Trono de huesos | 2.5e15 | 1.6e9 |
| 15 | Vacío verdoso | 4.0e16 | 9.0e9 |

## Mejoras (niveles, max Lv 5)

Cada mejora escala con `costo = base × 2.5^nivel`. Efecto por nivel según tipo:

| Nombre | Tipo | Efecto por nivel |
|--------|------|------------------|
| Dedos podridos | click | ×1.5 click |
| Mandíbula filosa | click | ×1.5 click |
| Garras infectadas | click | ×1.6 click |
| Puño demolición | click | ×1.7 click |
| Reflejos muertos | click | ×1.5 click |
| Click del fin | click | ×2 click (tarde) |
| Superviviente veloz | generador | ×1.5 superviviente |
| Mordedura profunda | generador | ×1.5 mordedor |
| Corredor mutado | generador | ×1.5 corredor |
| Rabia eterna | generador | ×1.5 rabioso |
| Jefe alpha | generador | ×1.5 jefe |
| Horda voraz | generador | ×1.5 horda |
| Necrópolis oscura | generador | ×1.5 necrópolis |
| Virus letal | generador | ×1.5 Virus Alfa |
| (+ mejoras de gens altos) | generador | ×1.5 por gen restante |
| Fuerza sobrenatural | global | +25% global |
| Hambre colectiva | global | +50% global (tarde) |
| Silencio de dioses | global | +50% global (tarde) |
| Golpe crítico | crit | +5% chance de crítico ×10 |
| Cerebros baratos | cheaper | −5% costo de generadores |

## Prestige (tienda de astillas)

- **BPS Boost**: +10% BPS
- **Click Boost**: +20% click (no BPS)
- **Soul Start**: +100 cerebros al resetear
- **Offline Boost**: +50% cap offline
- **Cheaper Generators**: -10% costo
- **Auto Click**: click cada 2 segundos
