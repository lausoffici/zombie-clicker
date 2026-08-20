# 🧟 Zombie Clicker — Cómo jugar

## ¿Qué es el juego?

**Zombie Clicker** es un juego *clicker incremental* de temática zombie. Tu objetivo es acumular **cerebros** 🧠 golpeando a un zombie y comprando **generadores** y **mejoras** que te produzcan cerebros automáticamente con el tiempo.

Es un juego de navegador hecho en HTML/CSS/JS vanilla, sin dependencias ni build step.

---

## Cómo abrirlo

1. Descargá o copiá la carpeta del proyecto.
2. **Hacé doble click en `index.html`** (o abrilo con tu navegador favorito).
3. El juego se carga directamente: no necesitás instalar nada ni levantar un servidor.

> 💡 El progreso se guarda automáticamente en tu navegador (localStorage) cada 10 segundos y al cerrar la pestaña.

---

## Mecánicas

### 🖱️ Click
- Hacé click en el botón **"🧟 ¡Golpear zombie!"** para ganar cerebros.
- Cada click suma el valor de tu **click** (empieza en **1 cerebro**).
- Podés mejorar el valor del click comprando mejoras de tipo *click*.

### 🏭 Generadores
- Los generadores producen **cerebros por segundo (bps)** de forma automática.
- Cada vez que comprás uno, su **costo aumenta** (crecimiento del 15%).
- Cuantos más generadores tengas, más rápido crece tu riqueza.

### ⬆️ Mejoras (Upgrades)
- Las mejoras son **compras únicas** que multiplican el poder de tu click o de un generador específico.
- Una vez comprada, desaparece de la lista.
- No se pueden comprar dos veces.

### 🌙 Progreso offline
- Si cerrás el navegador y volvés más tarde, tus generadores **siguieron produciendo cerebros** mientras estabas fuera.
- Al volver, se te muestra un mensaje con la cantidad de cerebros ganados.
- El cálculo se basa en tu **bps** y los segundos transcurridos desde tu último guardado.

---

## 🏭 Lista de Generadores

| # | Nombre | Descripción | Costo base | BPS |
|---|--------|-------------|------------|-----|
| 1 | **Superviviente** | Busca cerebros por la ciudad. | 15 🧠 | 0.1 |
| 2 | **Barricada** | Atrapa supervivientes desprevenidos. | 100 🧠 | 1 |
| 3 | **Granja de Cerebros** | Cultiva cerebros frescos en masa. | 1,100 🧠 | 8 |
| 4 | **Laboratorio** | Experimenta con virus y cerebros. | 12,000 🧠 | 47 |
| 5 | **Horda Zombie** | Un ejército incesante de hambrientos. | 130,000 🧠 | 260 |
| 6 | **Colina de Cráneos** | Una montaña de cerebros acumulados. | 1,400,000 🧠 | 1,400 |

> El costo de cada generador crece un **15%** por cada unidad comprada.

---

## ⬆️ Lista de Mejoras (Upgrades)

| # | Nombre | Descripción | Costo | Efecto |
|---|--------|-------------|-------|--------|
| 1 | **Dedos Podridos** | Tus dedos se vuelven más eficientes. | 100 🧠 | Click **x2** |
| 2 | **Refuerzo de Barricada** | Barricadas más letales. | 1,000 🧠 | Barricada **x2** |
| 3 | **Cerebro Premium** | Cerebros de mayor calidad. | 5,000 🧠 | Click **x2** |
| 4 | **Cultivo Acelerado** | Crecimiento más rápido. | 20,000 🧠 | Granja de Cerebros **x2** |

> Las mejoras son **únicas**: una vez compradas, no vuelven a aparecer.

---

## 📊 Resumen rápido

- **Moneda:** Cerebros 🧠
- **Click inicial:** 1 cerebro
- **Generadores:** 6 (producción automática)
- **Mejoras:** 4 (multiplicadores únicos)
- **Guardado:** automático cada 10 s + al cerrar
- **Offline:** tus generadores siguen trabajando

¡A por todos esos cerebros! 🧠🧟
