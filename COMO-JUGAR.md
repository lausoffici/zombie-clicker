# Zombie Clicker — Cómo jugar

## ¿Qué es?

**Zombie Clicker** es un juego *clicker incremental* de temática zombie. Tu objetivo es acumular **cerebros** haciendo click en un zombie y comprando **generadores** y **mejoras** que produzcan cerebros automáticamente. Con el tiempo podés **prestigiar** para subir el nivel de Almas y ganar **astillas**. Los **huesos** se acumulan con eventos; todavía no se gastan.

Hecho en HTML/CSS/JS vanilla. Abrí `index.html` en tu navegador y jugá.

> El progreso se guarda automáticamente en `localStorage` cada 15 segundos y al cerrar la pestaña.

## Mecánicas principales

### Click
- Hacé click en el **zombie** para ganar cerebros.
- El valor de cada click se multiplica con upgrades de click, el **multiplicador global** y el prestige **Click Boost** (solo click, no BPS).

### Generadores
- 15 tipos. Cada compra sube el costo un **15%**.
- **Hitos gratis:** a las 25, 50, 100, 200 y 400 unidades, ese generador duplica su BPS.
- Compra x1 / x10 / Max.

### Mejoras
- Compras únicas de la run: click, un generador, o BPS global.
- Las de generador se revelan al tener 1 / 50 / 100 de ese tipo.

### Logros
- Se desbloquean solos. Cada uno suma **+2%** al multiplicador global.

### Prestigio: Almas vs astillas
Al **Ascender** reiniciás cerebros, generadores y mejoras de **esta run**.

- **Almas (nivel):** permanentes. No se gastan. Cada una → **+5%** multiplicador global.
- **Astillas:** se ganan igual que las almas al ascender, y **sí** se gastan en la tienda de prestige y en cosméticos.
- Fórmula de la run: `floor(sqrt(cerebrosDeLaRun / 1e9))` — la primera alma pide 1.000 millones de cerebros de esta vida.
- Consejo: conviene ascender cuando puedas **duplicar tu nivel** de almas.

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

## Prestige (tienda de astillas)

- **BPS Boost**: +10% BPS
- **Click Boost**: +20% click (no BPS)
- **Soul Start**: +100 cerebros al resetear
- **Offline Boost**: +50% cap offline
- **Cheaper Generators**: -10% costo
- **Auto Click**: click cada 2 segundos
