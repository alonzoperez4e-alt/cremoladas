# Frontend de Cremoladas 🍧

Sistema web moderno y responsive (mobile-first) para la gestión y punto de venta (POS) de un negocio de cremoladas artesanales en Perú.

---

## 🚀 Tecnologías

- **Vite 6** + **React 18** (JavaScript JSX, sin TypeScript)
- **Tailwind CSS v4** integrado vía `@tailwindcss/vite`
- **React Router v6** (`createBrowserRouter`, rutas protegidas y code splitting con `React.lazy` y `Suspense`)
- **TanStack Query v5 (React Query)**: Caché del servidor, actualización optimista para disponibilidad de sabores, estados de carga/error e invalidación selectiva de queries
- **Axios**: Instancia única con interceptores para inyección de token JWT y auto-redirección ante expiración (401)
- **React Hook Form** + **Zod** + **@hookform/resolvers**: Validación tipada de formularios en cliente con mapeo automático de errores del backend
- **Lucide React**: Iconos SVG optimizados
- **Sonner**: Notificaciones toast modernas con colores enriquecidos

---

## 📋 Requisitos Previos

- **Node.js**: Versión 20 o superior.
- **Backend de Cremoladas**: Servidor Express corriendo (por defecto en `http://localhost:4000`).

---

## ⚙️ Instalación y Configuración

1. **Clonar e ingresar a la carpeta del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de que la variable `VITE_API_URL` apunte a tu servidor backend (sin barra final `/`):
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```

4. **Configurar CORS en el backend:**
   En el archivo `.env` del backend (`backend/.env`), asegúrate de que la variable `CLIENT_URL` coincida con la URL del frontend de Vite (por defecto `http://localhost:5173`):
   ```env
   CLIENT_URL=http://localhost:5173
   ```

---

## 🏃‍♂️ Ejecución

- **Modo Desarrollo:**
  ```bash
  npm run dev
  ```
  La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

- **Construcción para Producción:**
  ```bash
  npm run build
  ```

- **Vista Previa del Bundle de Producción:**
  ```bash
  npm run preview
  ```

- **Linter de Código:**
  ```bash
  npm run lint
  ```

---

## 🍦 Flujo de Venta y Punto de Venta (POS)

El módulo de venta opera bajo una jornada diaria (America/Lima):

1. **Inicio de la Jornada (`/` y `/venta`):**
   - Si no ha iniciado (`not_started`), se presenta el botón "Iniciar venta" tanto en la tarjeta del panel principal como en `/venta`.
   - Al pulsar se pide confirmación y se llama a `POST /sales-days/today/start`. Si ya fue iniciada en otro dispositivo (409), el cliente refresca el estado y permite continuar.
2. **Constructor de Vasos (`CupBuilder`):**
   - Cada vaso cuesta **S/ 2.00** sin importar cuántos sabores lleve (mostrado como estimado mediante `CUP_PRICE_DISPLAY = 2`).
   - Se seleccionan de 1 a 6 sabores por vaso sin repetir.
   - El componente `CupPreview` dibuja el vaso con franjas proporcionales con el color y emoji de cada sabor.
   - Los sabores agotados no pueden seleccionarse. Si un sabor elegido se agota mientras está en el vaso, se quita automáticamente con notificación.
   - Selector táctil de cantidad (1 a 50).
3. **Carrito Inteligente (`useCart`):**
   - **Fusión automática**: Dos líneas con la misma combinación de sabores (sin importar el orden en que se eligieron) se unen sumando sus cantidades (con tope de 50 por combinación).
   - Soporta hasta 50 combinaciones por venta.
   - Persistencia local en `localStorage` asociada a la fecha de hoy en Lima (se descarta al cambiar el día).
   - Barra fija inferior (sticky) con total estimado y botón "Registrar venta" con protección contra doble clic / doble toque.
4. **Registro de Venta (`POST /sales`):**
   - Envía `{ items: [{ flavorIds, quantity }] }`.
   - Si un sabor se agota en el momento de registrar (409 `FLAVOR_SOLD_OUT`), se marcan en rojo las líneas afectadas en el carrito y se ofrece el botón "Quitar vasos con sabores agotados", manteniendo el resto del pedido intacto.
5. **Cierre de Jornada (`POST /sales-days/today/close`):**
   - Solo permitido con jornada abierta. Pide confirmación y advierte si hay vasos en el carrito.
   - Tras cerrarse (manual o automáticamente a las 00:00 de Lima), la pantalla pasa a **modo solo lectura** impidiendo registrar nuevas ventas.

---

## 🔑 Claves de Caché de TanStack Query

Las queries están estructuradas para compartir y sincronizar datos en tiempo real entre pantallas:

| Clave de Query | Módulo / Endpoint | Invalidación / Refresco |
| :--- | :--- | :--- |
| `['stats']` | `GET /stats/summary` | Se invalida al registrar ventas, registrar preparaciones, registrar gastos o cerrar jornadas. |
| `['sales-day-today']` | `GET /sales-days/today` | Polling en ventana activa (60s en panel, 30s en venta). Se invalida al iniciar o cerrar la jornada y al registrar ventas. |
| `['sales-today']` | `GET /sales-days/today/sales` | Polling en ventana activa (30s en venta). Se invalida al registrar una venta o cerrar la jornada. |
| `['flavors']` | `GET /flavors` | Sincronizado con `useToggleSoldOut` mediante **actualizaciones optimistas** instantáneas y rollback en caso de error. |
| `['expenses']` | `GET /expenses` | Se invalida al crear, editar o eliminar gastos y materiales. |
| `['preparations']` | `GET /preparations` | Se invalida al crear, editar o eliminar preparaciones. |
| `['materials']` | `GET /materials` | Se invalida al crear o editar materiales. |

---

## 💡 Adaptaciones y Verificación de la API Real

1. **Formato de Respuesta de Autenticación (`POST /auth/login` y `GET /auth/me`):**
   - El endpoint `POST /auth/login` devuelve directamente `{ token, user: { id, username, fullName } }` (sin encapsular bajo `{ data: ... }`). El cliente HTTP soporta ambos formatos transparentemente (`response.data?.data || response.data`).
   - El endpoint `GET /auth/me` devuelve `{ user: { id, username, fullName, isActive, ... } }`.
2. **Formato de Listados Paginados (`GET /expenses` y `GET /preparations`):**
   - Las respuestas devuelven `{ data: [...], pagination: { page, pageSize, total }, summary: { totalAmount } }`.
   - El total del filtro se calcula directamente en el servidor sobre todo el conjunto filtrado y se muestra de forma destacada en la cabecera del historial.
3. **Manejo de Zona Horaria (America/Lima):**
   - El backend y la base de datos operan en la zona horaria `America/Lima`.
   - Fechas y horas (`formatTime`) se renderizan siempre en la zona de Lima (`Intl.DateTimeFormat`), evitando desfases provocados por la zona del dispositivo.
4. **Manejo de Conflictos (409):**
   - `FLAVOR_SOLD_OUT`: Incluye los sabores en `details`, lo que permite identificar y marcar visualmente las líneas afectadas en el carrito.
   - `DAY_ALREADY_STARTED`: Si la jornada ya fue abierta desde otro dispositivo, se sincroniza el estado local y se redirige a `/venta`.
   - `DAY_ALREADY_CLOSED`: Se pasa a modo solo lectura sin alertar un error bloqueante.

---

## 📁 Estructura del Proyecto

```text
frontend/
├── .env.example                # Plantilla de variables de entorno
├── index.html                  # HTML de entrada con carga optimizada de Inter
├── package.json                # Scripts y dependencias
├── vite.config.js              # Configuración de Vite con React y Tailwind v4
├── eslint.config.js            # Configuración plana de ESLint 9
└── src/
    ├── main.jsx                # Punto de entrada de React con Providers
    ├── App.jsx                 # Componente raíz
    ├── index.css               # Tokens de diseño Tailwind v4 y estilos base
    ├── api/
    │   ├── client.js           # Instancia Axios con interceptores de Auth y token
    │   ├── auth.api.js         # Endpoints de login, perfil y cambio de contraseña
    │   ├── flavors.api.js      # CRUD de sabores y toggle de disponibilidad
    │   ├── materials.api.js    # CRUD de materiales/insumos
    │   ├── expenses.api.js     # CRUD y listado paginado de gastos
    │   ├── preparations.api.js # CRUD y listado paginado de preparaciones
    │   ├── salesDays.api.js    # Endpoints de jornada de venta (today, start, close, sales)
    │   └── sales.api.js        # Endpoint de registro de ventas
    ├── auth/
    │   ├── context.js          # React Context de autenticación
    │   ├── AuthContext.jsx     # AuthProvider con validación inicial de sesión
    │   ├── useAuth.js          # Hook de acceso al contexto de autenticación
    │   └── ProtectedRoute.jsx  # Componente para proteger rutas privadas
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx         # Botones con variantes y tamaño táctil (min 44px)
    │   │   ├── Input.jsx          # Inputs con label, prefijos y mensajes de error
    │   │   ├── Select.jsx         # Selects accesibles con flecha estilizada
    │   │   ├── Modal.jsx          # Modal con backdrop, soporte Esc y scroll lock
    │   │   ├── ConfirmDialog.jsx  # Diálogo de confirmación para acciones críticas
    │   │   ├── Spinner.jsx        # Indicador de carga accesible
    │   │   ├── Skeleton.jsx       # Placeholders de carga animados
    │   │   ├── EmptyState.jsx     # Estados vacíos con icono y acción
    │   │   ├── ErrorState.jsx     # Estados de error con botón "Reintentar"
    │   │   ├── Pagination.jsx     # Controles táctiles de paginación
    │   │   └── FlavorBadge.jsx    # Badge con emoji, color y contraste de texto garantizado
    │   └── layout/
    │       ├── AppLayout.jsx      # Layout envolvente
    │       ├── Topbar.jsx         # Barra superior con hamburguesa y nombre de usuario
    │       └── Sidebar.jsx        # Drawer deslizante con animaciones y navegación
    ├── features/
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── StatCard.jsx              # Tarjeta de métrica con soporte de negativos
    │   │   │   ├── SalesDayCard.jsx          # Cuadro táctil interactivo de venta del día
    │   │   │   └── FlavorAvailabilityList.jsx # Lista con interruptores de sabores agotados
    │   │   └── hooks/
    │   │       └── useStats.js               # Hook para summary de estadísticas
    │   ├── sales/
    │   │   ├── components/
    │   │   │   ├── CupPreview.jsx            # Vaso visual con franjas proporcionales
    │   │   │   ├── CupBuilder.jsx            # Selector de sabores (hasta 6) y cantidad
    │   │   │   ├── Cart.jsx                  # Carrito con fusión de líneas y avisos de agotado
    │   │   │   ├── SalesList.jsx             # Resumen de totales y ventas cronológicas de hoy
    │   │   │   └── FlavorBreakdown.jsx       # Desglose de ingresos y vasos por sabor
    │   │   └── hooks/
    │   │       ├── useCart.js                # Hook con reducer y persistencia en localStorage
    │   │       ├── useSalesDays.js           # Hooks para estado, inicio y cierre de jornada
    │   │       └── useSales.js               # Hook para mutación de registro de venta
    │   ├── flavors/
    │   │   ├── components/FlavorFormModal.jsx # Formulario con paleta y color libre
    │   │   ├── hooks/useFlavors.js            # Queries y mutación con toggle optimista
    │   │   └── pages/FlavorsPage.jsx          # Catálogo visual de sabores
    │   ├── materials/
    │   │   ├── components/MaterialFormModal.jsx # Creación rápida de material
    │   │   └── hooks/useMaterials.js            # Hooks de React Query para materiales
    │   ├── expenses/
    │   │   ├── components/ExpenseEditModal.jsx  # Modal de edición de gasto
    │   │   ├── hooks/useExpenses.js             # Hooks de React Query para gastos
    │   │   └── pages/ExpensesPage.jsx           # Formulario rápido + historial filtrado
    │   └── preparations/
    │       ├── components/PreparationEditModal.jsx # Modal de edición de preparación
    │       ├── hooks/usePreparations.js            # Hooks de React Query para preparaciones
    │       └── pages/PreparationsPage.jsx          # Formulario rápido + historial filtrado
    ├── lib/
    │   ├── config.js          # Constantes globales del negocio y CUP_PRICE_DISPLAY
    │   ├── dates.js           # Utilidades de fecha en zona horaria Lima
    │   ├── errors.js          # Traductor central de errores y mapper a formularios
    │   ├── flavorIcons.js     # Catálogo de iconos, emojis y cálculo de contraste
    │   └── format.js          # Formateo de moneda (S/ PEN), fechas y horas en Lima
    ├── pages/
    │   ├── LoginPage.jsx          # Login con validación Zod y toggle de contraseña
    │   ├── HomePage.jsx           # Panel de inicio real (estadísticas, venta del día, sabores)
    │   ├── SalePage.jsx           # Panel de venta real con POS y constructor táctil
    │   ├── ChangePasswordPage.jsx # Cambio de contraseña con validación de seguridad
    │   └── NotFoundPage.jsx       # Página 404 personalizada
    └── routes/
        └── router.jsx         # createBrowserRouter con lazy loading y Suspense
```

---

## 📱 Criterios de Aceptación Cumplidos

- [x] **`npm run build`** finaliza sin errores ni advertencias (código de salida 0).
- [x] **`npm run lint`** finaliza sin errores ni advertencias (código de salida 0).
- [x] **Panel Principal (`/`)**: Muestra las 3 tarjetas de estadísticas, el cuadro de venta del día y la lista de sabores, en ese orden exacto, con el menú lateral oculto por defecto.
- [x] **Ganancias Netas**: Si es negativa, se muestra en rojo con signo menos visible (`-S/ XX.XX`).
- [x] **Inicio de Venta**: Cuadro clicable que abre diálogo "¿Deseas iniciar la venta de hoy?". Al confirmar inicia y navega a `/venta`; si ya estaba abierta (409), redirige limpiamente. Con jornada abierta navega directo a `/venta`, y con jornada cerrada navega a `/venta` en modo solo lectura.
- [x] **Interruptor de Sabores Agotados**: Switch accesible con toggle optimista en el cliente y reversión automática ante error. El sabor queda inmediatamente bloqueado en el constructor de vasos.
- [x] **Constructor de Vasos**: Cuadrícula de sabores táctil con bloqueo de agotados, selección de hasta 6 sabores sin repetir y vista previa del vaso con franjas de colores.
- [x] **Fusión de Líneas en el Carrito**: Vasos con la misma combinación de sabores (sin importar el orden) se unen en una sola línea sumando cantidades (con tope de 50).
- [x] **Persistencia del Carrito**: Permanece al recargar en el mismo día y se descarta al cambiar de fecha.
- [x] **Protección contra Doble Envío**: El botón "Registrar venta" bloquea inmediatamente vía `ref` y estado loading para evitar compras duplicadas por doble toque.
- [x] **Manejo de Errores al Vender**: Ante `FLAVOR_SOLD_OUT`, marca en rojo las líneas afectadas y ofrece el botón "Quitar agotados", manteniendo el resto del carrito intacto.
- [x] **Cierre de Jornada**: Diálogo de confirmación, cierre manual y transición a solo lectura. Si se cierra automáticamente a medianoche, la pantalla lo detecta y pasa a solo lectura avisando al usuario.
- [x] **Mobile First**: Totalmente usable en pantallas desde 360 px, con barra fija inferior con relleno `env(safe-area-inset-bottom)` que no tapa ningún elemento.
