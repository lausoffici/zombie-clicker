# 🧟 Zombie Clicker — Cómo jugar

## ¿Qué es?

**Zombie Clicker** es un juego *clicker incremental* de temática zombie. Tu objetivo es acumular **cerebros** 🧠 haciendo click en un zombie y comprando **generadores** y **mejoras** que produzcan cerebros automáticamente. Con el tiempo podés **prestigiar** para ganar almas y multiplicadores permanentes.

Hecho en HTML/CSS/JS vanilla, sin dependencias de npm ni build step. **Serví el juego por HTTP** (`python -m http.server 8000`) y abrí `http://localhost:8000`. Abrir `index.html` como `file://` funciona para jugar local, pero **rompe el login en la nube**.

> 💡 El progreso se guarda automáticamente en este dispositivo (`localStorage`) cada 15 segundos y al cerrar la pestaña. Si creás una cuenta, también se sincroniza a la nube para seguir en otro lado.

---

## Mecánicas principales

### 🖱️ Click
- Hacé click en el **zombie** para ganar cerebros.
- El valor de cada click se multiplica con upgrades de click y con el **multiplicador global**.
- Debajo del zombie se ven tus stats de click: **valor por click**, **% de crítico** y los **cerebros que da un crítico**.

### 🏭 Generadores
- Comprá generadores para producir cerebros por segundo (BPS) de forma automática.
- Cada generador comprado aumenta su costo en un **15%**.
- Podés comprar de a 1, 10 o la cantidad máxima que alcance.

### ⬆️ Mejoras
- Se compran con cerebros y tienen **hasta 5 niveles** cada una.
- Cada nivel potencia click, un generador, el multiplicador global, críticos o costos más baratos.
- El costo sube un **×2.5** por nivel. La carta muestra `Lv N/5` y una barra hacia el próximo costo.
- Al llegar a nivel máximo se marca **MÁX** y queda visible.
- Al prestigiar se reinician (las de prestigio / almas no).

### 🏆 Logros
- Se desbloquean automáticamente al alcanzar milestones (clicks, cerebros totales, generadores).
- Cada logro desbloqueado suma un **+2%** al multiplicador global.

### ✨ Prestigio
Las **Almas** no se pierden. Al **Ascender**, la horda vuelve a cero (cerebros, generadores y mejoras) y te quedás con Almas permanentes. Logros, skins y compras de la tienda de almas también se conservan.

1. Juntá cerebros (cuenta el **total** de la partida).
2. Ascendé para convertir ese progreso en Almas.
3. Gastá Almas en la pestaña **Almas** de la tienda: esas mejoras no se reinician.

- Cada Alma → **+5%** a clicks y cerebros por segundo
- La primera Alma aparece al **1 millón** de cerebros totales (4M → 2, 9M → 3, 25M → 5)

En la tienda, pestaña **Almas**, podés gastarlas en mejoras permanentes:
  - **BPS Boost**: +10% BPS
  - **Click Boost**: +20% click
  - **Soul Start**: +100 cerebros iniciales tras reset
  - **Offline Boost**: +50% cap de offline
  - **Cheaper Generators**: -10% costo
  - **Auto Click**: click automático cada 2 segundos

### 🌙 Progreso offline
- Si cerrás el juego, tus generadores siguen produciendo hasta **8 horas**.
- El upgrade **Offline Boost** aumenta ese límite un 50% por nivel.
- Al volver, aparece un toast con los cerebros ganados.

### ⚡ Eventos
- **Cerebro dorado** 🧠: aparece cada 1–3 minutos. Clickalo para ganar cerebros instantáneos.
- **Jefe de la horda** 👹: aparece cada 3–6 minutos. Clickalo rápido para derrotarlo y ganar una recompensa.

### 💾 Exportar / importar
- En la pestaña **Estadísticas** podés copiar tu partida como texto o pegar una para restaurarla.
- Si estás logueado, importar o reiniciar también actualiza la nube.

### 👤 Cuenta (opcional)
- Podés jugar como invitado: el progreso queda en este navegador.
- El botón de **usuario** en la barra de arriba abre Crear cuenta / Entrar (email + contraseña + apodo).
- Al entrar, se elige el save con **más progreso** (almas totales, luego cerebros totales).
- Cerrar sesión no borra el progreso local ni el de la nube.
- Setup de la nube (una vez): ver `docs/superpowers/specs/2026-08-21-accounts-supabase.md`.

---

## 🏭 Generadores (10)

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

---

## ⬆️ Mejoras (16, max Lv 5)

Cada mejora escala con `costo = base × 2.5^nivel`. Efecto por nivel según tipo:

| Nombre | Tipo | Efecto por nivel |
|--------|------|------------------|
| Dedos podridos | click | ×1.5 click |
| Mandíbula filosa | click | ×1.5 click |
| Garras infectadas | click | ×1.6 click |
| Puño demolición | click | ×1.7 click |
| Reflejos muertos | click | ×1.5 click |
| Superviviente veloz | generador | ×1.5 superviviente |
| Mordedura profunda | generador | ×1.5 mordedor |
| Corredor mutado | generador | ×1.5 corredor |
| Rabia eterna | generador | ×1.5 rabioso |
| Jefe alpha | generador | ×1.5 jefe |
| Horda voraz | generador | ×1.5 horda |
| Necrópolis oscura | generador | ×1.5 necrópolis |
| Virus letal | generador | ×1.5 Virus Alfa |
| Fuerza sobrenatural | global | +25% global |
| Golpe crítico | crit | +5% chance de crítico ×10 |
| Cerebros baratos | cheaper | −5% costo de generadores |

---

## 🏆 Logros (8)

- Primer cerebro, Cerebros x100, Clicks x100, Clicks x1000
- Primer generador, Horda pequeña (10), Horda grande (50)
- Ejército completo (1 de cada generador)

Cada uno da **+2%** multiplicador global.

---

## Atajos

- **Pestañas**: Juego / Logros / Prestigio / Estadísticas.
- **Tienda**: Generadores, Mejoras, Cosméticos y **Almas** (mejoras permanentes).
- **Botones del header**: cuenta, 💾 guardar manual, 🔄 reiniciar partida.
- **Prestigio**: el botón "Ascender" se habilita cuando tenés almas para ganar.

¡A convertir humanos en cerebros! 🧠🧟
