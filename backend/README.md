# Cremoladas Backend API 🍧

Backend completo para el sistema web de venta y gestión de cremoladas, desarrollado con **Node.js**, **Express** y **Neon PostgreSQL**.

---

## 📋 Requisitos previos

- **Node.js**: Versión 20.x o superior
- **npm**: Versión 10.x o superior
- **Neon PostgreSQL**: Base de datos activa con el esquema base y la migración `002_fixed_cup_price.sql` aplicada.

> [!NOTE]
> **Zona horaria del negocio**: El sistema opera bajo la zona horaria **`America/Lima` (UTC-5)**. Toda consulta y validación de fechas de negocio utiliza la función `today_lima()` de PostgreSQL; nunca se utiliza `new Date()` del servidor local.

---

## 🗄️ Migraciones de Base de Datos

### Migración 002: Modelo de vaso con precio fijo (`002_fixed_cup_price.sql`)
La migración se encuentra en `db/migrations/002_fixed_cup_price.sql`. Introduce la tabla `app_settings` con `cup_price = '2.00'`, adapta `sale_items` a vasos y crea `sale_item_flavors` para admitir vasos simples o surtidos (1 a 6 sabores) al mismo precio.

> [!IMPORTANT]
> **Ejecución manual**: Esta migración **NO** se ejecuta automáticamente al iniciar la aplicación. Debe ejecutarse manualmente desde el **SQL Editor de la consola de Neon**:
> 1. Ingrese a la consola de [Neon Console](https://console.neon.tech).
> 2. Seleccione su proyecto y diríjase a **SQL Editor**.
> 3. Abra el archivo `backend/db/migrations/002_fixed_cup_price.sql`, copie su contenido y presione **Run**.

---

## 🚀 Instalación y configuración

### 1. Clonar e ingresar al directorio
```bash
cd backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copie `.env.example` como `.env`:

```bash
cp .env.example .env
```

Edite `.env` con sus credenciales de Neon:

| Variable | Descripción | Valor por defecto / Requerido |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno (`development`, `production`, `test`) | `development` |
| `PORT` | Puerto del servidor HTTP | `4000` |
| `DATABASE_URL` | Cadena de conexión Neon PostgreSQL con SSL (`sslmode=require`) | **Obligatorio** |
| `JWT_SECRET` | Clave secreta para JWT (mínimo 32 caracteres) | **Obligatorio** |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT (ej: `8h`, `1d`) | `8h` |
| `CLIENT_URL` | Orígenes permitidos por CORS (separados por coma) | **Obligatorio** |
| `TRUST_PROXY` | Habilitar si corre tras proxy inverso (Render, Railway) | `false` |
| `ENABLE_CRON` | Habilitar jobs programados de cierre con `node-cron` | `true` |
| `RATE_LIMIT_LOGIN_MAX` | Intentos máximos de login por IP | `10` |
| `RATE_LIMIT_LOGIN_WINDOW_MINS`| Ventana de tiempo para login (minutos) | `15` |
| `RATE_LIMIT_GLOBAL_MAX` | Límite de peticiones general a la API | `100` |
| `RATE_LIMIT_GLOBAL_WINDOW_MINS`| Ventana de tiempo global (minutos) | `15` |

---

## 👤 Seed del Administrador

Para inicializar de forma segura el usuario administrador:

```bash
npm run seed:admin
```

Para forzar el cambio de contraseña:
```bash
npm run seed:admin -- --reset-password
```

---

## ⏰ Cierre Automático de Jornadas

El sistema implementa una estrategia dual para garantizar que ninguna jornada quede abierta indebidamente:

1. **Cierre perezoso (Lazy Close)**: Antes de resolver cualquier petición de jornadas (`/api/sales-days/*`) o ventas (`/api/sales`), se invoca `SELECT close_overdue_sales_days()`. Esto garantiza consistencia total incluso en **entornos serverless** (como Vercel, AWS Lambda o Render en modo sleep) sin requerir un proceso en segundo plano continuo.
2. **Job programado (`src/jobs/closeOverdueDays.js`)**: Cuando el servidor corre como proceso continuo (`ENABLE_CRON=true`), `node-cron` ejecuta dos tareas:
   - A las **00:00 (hora de Lima)**: Cierra automáticamente las jornadas vencidas asignando `closed_by = 'auto'` y `closed_at` exactamente a las 00:00 (Lima) del día siguiente.
   - Cada **10 minutos**: Tarea de respaldo preventiva.

---

## 🏃 Ejecutar el servidor y pruebas

```bash
# Desarrollo con Nodemon
npm run dev

# Producción
npm start

# Suite de pruebas automatizadas
npm test

# Linter ESLint
npm run lint
```

---

## 📡 Endpoints de la API

> Todas las rutas (excepto `/api/health` y `/api/auth/login`) requieren el encabezado:
> `Authorization: Bearer <TU_TOKEN_JWT>`

### 1. Autenticación y Perfil
- `POST /api/auth/login`: Autenticación y generación de JWT.
- `GET /api/auth/me`: Perfil del usuario activo.
- `POST /api/auth/change-password`: Cambio de contraseña.

---

### 2. Módulo de Sabores (`/api/flavors`)
- `GET /api/flavors`: Lista sabores activos ordenados por nombre.
  - Query opcional: `?available=true` (excluye sabores agotados).
  ```bash
  curl -X GET "http://localhost:4000/api/flavors?available=true" \
    -H "Authorization: Bearer <TOKEN>"
  ```
- `GET /api/flavors/:id`: Detalle de un sabor.
- `POST /api/flavors`: Crear nuevo sabor.
  ```bash
  curl -X POST http://localhost:4000/api/flavors \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{ "name": "Maracuyá", "color": "#FFA500", "icon": "fruit-passion" }'
  ```
- `PUT /api/flavors/:id`: Editar sabor (`name`, `color`, `icon`).
- `PATCH /api/flavors/:id/sold-out`: Marcar/desmarcar agotado.
  ```bash
  curl -X PATCH http://localhost:4000/api/flavors/1/sold-out \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{ "isSoldOut": true }'
  ```
- `DELETE /api/flavors/:id`: Borrado lógico (`is_active = false`).

---

### 3. Módulo de Materiales (`/api/materials`)
- `GET /api/materials`: Lista de materiales activos para el selector de gastos.
- `POST /api/materials`: Registrar material.
  ```bash
  curl -X POST http://localhost:4000/api/materials \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{ "name": "Vasos descartables 8oz" }'
  ```
- `PUT /api/materials/:id`: Renombrar material.
- `DELETE /api/materials/:id`: Borrado lógico.

---

### 4. Módulo de Gastos (`/api/expenses`)
- `GET /api/expenses`: Listado paginado con filtros opcionales `from`, `to`, `materialId`. Incluye `summary: { totalAmount }` sobre todo el conjunto filtrado.
  ```bash
  curl -X GET "http://localhost:4000/api/expenses?page=1&pageSize=20&from=2026-10-01&to=2026-10-18" \
    -H "Authorization: Bearer <TOKEN>"
  ```
- `POST /api/expenses`: Registrar gasto. Si no se envía `expenseDate`, toma la fecha actual de Lima.
  ```bash
  curl -X POST http://localhost:4000/api/expenses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{
      "materialId": 1,
      "amount": 45.50,
      "expenseDate": "2026-10-18",
      "description": "Compra de 100 vasos y sorbetes"
    }'
  ```
- `PUT /api/expenses/:id`: Editar gasto.
- `DELETE /api/expenses/:id`: Borrado físico.

---

### 5. Módulo de Preparaciones (`/api/preparations`)
- `GET /api/preparations`: Listado paginado con filtros `from`, `to`, `flavorId`. Cada fila incluye datos del sabor (`flavorName`, `flavorColor`, `flavorIcon`) y `summary: { totalAmount }`.
- `POST /api/preparations`: Registrar preparación e inversión. Un sabor agotado SÍ puede recibir preparaciones.
  ```bash
  curl -X POST http://localhost:4000/api/preparations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{
      "flavorId": 1,
      "investmentAmount": 35.00,
      "prepDate": "2026-10-18",
      "description": "Lote de 5 litros de cremolada"
    }'
  ```
- `PUT /api/preparations/:id`: Editar preparación.
- `DELETE /api/preparations/:id`: Borrado físico.

---

### 6. Módulo de Jornadas (`/api/sales-days`)
- `GET /api/sales-days/today`: Estado de la jornada de hoy (para el panel principal).
  ```bash
  curl -X GET http://localhost:4000/api/sales-days/today \
    -H "Authorization: Bearer <TOKEN>"
  ```
  **Respuesta**:
  ```json
  {
    "data": {
      "date": "2026-10-18",
      "status": "open",
      "salesDay": {
        "id": 1,
        "status": "open",
        "openedAt": "2026-10-18T14:00:00.000Z",
        "closedAt": null,
        "closedBy": null
      },
      "totals": {
        "salesCount": 12,
        "cupsSold": 24,
        "totalSold": 48.00
      }
    }
  }
  ```
- `POST /api/sales-days/today/start`: Iniciar la jornada de hoy. Si ya existe, responde 409 `DAY_ALREADY_STARTED`.
- `POST /api/sales-days/today/close`: Cerrar manualmente la jornada de hoy (`closed_by = 'manual'`).
- `GET /api/sales-days/today/sales`: Detalle para el panel de venta con ventas agrupadas, vasos y estadísticas por sabor (`v_sales_day_by_flavor`).
- `GET /api/sales-days`: Historial paginado de jornadas (`from`, `to`).

---

### 7. Módulo de Ventas (`/api/sales`)
- `POST /api/sales`: Registra una venta en una **única transacción segura**:
  - Verifica jornada abierta (`FOR SHARE`).
  - Verifica que los sabores existan, estén activos y no estén agotados (`FOR SHARE`).
  - Obtiene el precio por vaso de `app_settings` (ignora cualquier precio del cliente).
  - Admite vasos simples y surtidos (1 a 6 sabores por vaso).
  ```bash
  curl -X POST http://localhost:4000/api/sales \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TOKEN>" \
    -d '{
      "items": [
        { "flavorIds": [1, 2], "quantity": 2 },
        { "flavorIds": [3], "quantity": 1 }
      ]
    }'
  ```
  **Respuesta 201 Created**:
  ```json
  {
    "data": {
      "id": 42,
      "total": 6.00,
      "createdAt": "2026-10-18T16:30:00.000Z",
      "items": [
        {
          "id": 101,
          "quantity": 2,
          "unitPrice": 2.00,
          "subtotal": 4.00,
          "flavors": [
            { "id": 1, "name": "Fresa", "color": "#FF0000", "icon": "fruit-red" },
            { "id": 2, "name": "Mango", "color": "#FFAA00", "icon": "fruit-yellow" }
          ]
        },
        {
          "id": 102,
          "quantity": 1,
          "unitPrice": 2.00,
          "subtotal": 2.00,
          "flavors": [
            { "id": 3, "name": "Maracuyá", "color": "#FFA500", "icon": "fruit-orange" }
          ]
        }
      ]
    }
  }
  ```

---

### 8. Módulo de Estadísticas (`/api/stats`)
- `GET /api/stats/summary`: Resumen global de inversión, ingresos brutos y ganancia neta.
  ```bash
  curl -X GET http://localhost:4000/api/stats/summary \
    -H "Authorization: Bearer <TOKEN>"
  ```
  **Respuesta**:
  ```json
  {
    "data": {
      "totalInvestment": 450.00,
      "totalRevenue": 1200.00,
      "netProfit": 750.00,
      "investmentBreakdown": {
        "preparations": 300.00,
        "expenses": 150.00
      }
    }
  }
  ```

---

## 🛡️ Formato estándar de respuestas y errores

- **Respuestas exitosas**: Formato `{ "data": ... }` o `{ "data": [...], "pagination": { "page", "pageSize", "total" } }`.
- **Formato homogéneo de errores**:
  ```json
  {
    "error": {
      "code": "STRING_IDENTIFIER",
      "message": "Descripción amigable del error",
      "details": []
    }
  }
  ```
- **Códigos de error de negocio**:
  - `400 VALIDATION_ERROR`: Fallo de validación en los campos enviados.
  - `400 MATERIAL_NOT_FOUND`: Material inexistente o inactivo.
  - `400 FLAVOR_NOT_FOUND`: Sabor inexistente o inactivo.
  - `401 TOKEN_MISSING / TOKEN_INVALID / TOKEN_EXPIRED`: Fallo de autenticación JWT.
  - `404 NOT_FOUND / EXPENSE_NOT_FOUND / PREPARATION_NOT_FOUND / DAY_NOT_STARTED`: Recurso no encontrado.
  - `409 FLAVOR_NAME_EXISTS / MATERIAL_NAME_EXISTS`: Nombre duplicado entre registros activos.
  - `409 FLAVOR_SOLD_OUT`: Intento de venta con sabor marcado como agotado.
  - `409 DAY_ALREADY_STARTED / DAY_ALREADY_CLOSED / DAY_CLOSED`: Restricciones de estado de jornada.
