# Cremoladas Backend API 🍧

Backend base para el sistema web de venta y gestión de cremoladas, desarrollado con **Node.js**, **Express** y conectado a **Neon DB (PostgreSQL)**.

---

## 📋 Requisitos previos

- **Node.js**: Versión 20.x o superior
- **npm**: Versión 10.x o superior
- **Neon PostgreSQL**: Base de datos activa con el esquema `cremoladas_schema.sql` aplicado.

> [!NOTE]
> **Zona horaria del negocio**: El sistema opera bajo la zona horaria **`America/Lima` (UTC-5)**. Las consultas y la lógica de negocio en la base de datos utilizan la función `today_lima()` para el control de jornadas y registros diarios.

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
Copie el archivo de ejemplo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Edite `.env` con sus credenciales reales:

| Variable | Descripción | Valor por defecto / Requerido |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno (`development`, `production`, `test`) | `development` |
| `PORT` | Puerto del servidor HTTP | `4000` |
| `DATABASE_URL` | Cadena de conexión Neon PostgreSQL con SSL | **Obligatorio** |
| `JWT_SECRET` | Clave secreta para JWT (mínimo 32 caracteres) | **Obligatorio** |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT (ej: `8h`, `1d`) | `8h` |
| `CLIENT_URL` | Orígenes permitidos por CORS (separados por coma) | **Obligatorio** |
| `TRUST_PROXY` | Habilitar si corre tras proxy inverso (Render, Railway) | `false` |
| `RATE_LIMIT_LOGIN_MAX` | Intentos máximos de login por IP | `10` |
| `RATE_LIMIT_LOGIN_WINDOW_MINS`| Ventana de tiempo para login (minutos) | `15` |
| `RATE_LIMIT_GLOBAL_MAX` | Límite de peticiones general a la API | `100` |
| `RATE_LIMIT_GLOBAL_WINDOW_MINS`| Ventana de tiempo global (minutos) | `15` |
| `ADMIN_USERNAME` | Usuario administrador para script de seed | Requerido por seed |
| `ADMIN_PASSWORD` | Contraseña administrador (mínimo 8 caracteres) | Requerido por seed |
| `ADMIN_FULL_NAME` | Nombre completo del administrador | Opcional |

#### Cómo obtener la `DATABASE_URL` de Neon
1. Inicie sesión en la consola de [Neon Console](https://console.neon.tech).
2. Seleccione su proyecto correspondiente al sistema de cremoladas.
3. En la sección **Dashboard**, ubique la tarjeta **Connection Details**.
4. Asegúrese de seleccionar la base de datos correspondiente y el rol deseado.
5. Copie la cadena en formato **Connection string**. La cadena tendrá una estructura similar a:
   ```text
   postgresql://usuario:contraseña@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Pegue este valor en la variable `DATABASE_URL` de su archivo `.env`.

---

## 👤 Seed del Administrador

Para crear el usuario administrador inicial en la base de datos de forma segura e idempotente:

```bash
npm run seed:admin
```

- Si el usuario no existe, se creará hasheando la contraseña con **bcrypt** (factor de costo 12).
- Si el usuario ya existe, el script es idempotente y no modificará los registros existentes.
- Si necesita restablecer la contraseña del usuario existente, utilice el flag `--reset-password`:

```bash
npm run seed:admin -- --reset-password
```

---

## 🏃 Ejecutar el servidor

### Modo desarrollo (con recarga automática mediante Nodemon)
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

### Comprobación de linter (ESLint)
```bash
npm run lint
```

---

## 📡 Endpoints de la API

Todas las rutas están centralizadas bajo el prefijo `/api`.

### 1. Estado del servicio (Health Check)
Comprueba el estado del backend y la conectividad activa con Neon PostgreSQL (`SELECT 1`).

- **Endpoint**: `GET /api/health`
- **Autenticación**: Pública
- **Ejemplo con curl**:
  ```bash
  curl -X GET http://localhost:4000/api/health
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "status": "ok",
    "db": "up",
    "timestamp": "2026-10-18T16:50:00.000Z"
  }
  ```

---

### 2. Iniciar sesión (Login)
Autentica al usuario mediante usuario y contraseña. Implementa rate limiting (10 intentos / 15 min) y protección contra timing attacks.

- **Endpoint**: `POST /api/auth/login`
- **Autenticación**: Pública
- **Ejemplo con curl**:
  ```bash
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "admin",
      "password": "CambiarEstaClaveSegura123!"
    }'
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Administrador del Sistema"
    }
  }
  ```

---

### 3. Obtener perfil actual (Me)
Devuelve los datos del usuario autenticado consultando directamente la base de datos para verificar que continúe activo.

- **Endpoint**: `GET /api/auth/me`
- **Autenticación**: Requerida (`Authorization: Bearer <TOKEN>`)
- **Ejemplo con curl**:
  ```bash
  curl -X GET http://localhost:4000/api/auth/me \
    -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Administrador del Sistema"
    }
  }
  ```

---

### 4. Cambiar contraseña
Permite al usuario autenticado modificar su contraseña. Valida la contraseña actual, que la nueva tenga al menos 8 caracteres y que sea diferente a la actual.

- **Endpoint**: `POST /api/auth/change-password`
- **Autenticación**: Requerida (`Authorization: Bearer <TOKEN>`)
- **Ejemplo con curl**:
  ```bash
  curl -X POST http://localhost:4000/api/auth/change-password \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <TU_TOKEN_JWT>" \
    -d '{
      "currentPassword": "CambiarEstaClaveSegura123!",
      "newPassword": "NuevaClaveSuperSegura456!"
    }'
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "message": "Contraseña actualizada exitosamente"
  }
  ```

---

## 🛡️ Formato estándar de errores

Todos los errores retornados por la API siguen un formato JSON homogéneo:

```json
{
  "error": {
    "code": "STRING_IDENTIFIER",
    "message": "Descripción amigable del error",
    "details": []
  }
}
```

### Códigos de error comunes
| Código | HTTP Status | Causa |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Campos inválidos o faltantes en el cuerpo de la petición |
| `INVALID_CURRENT_PASSWORD` | 400 | La contraseña actual no coincide al intentar cambiarla |
| `TOKEN_MISSING` | 401 | No se incluyó el header `Authorization` |
| `TOKEN_INVALID` | 401 | Formato inválido o firma de JWT errónea |
| `TOKEN_EXPIRED` | 401 | El token JWT ha caducado |
| `INVALID_CREDENTIALS` | 401 | Usuario inexistente, contraseña errónea o usuario inactivo (mensaje idéntico) |
| `USER_INACTIVE` | 401 | El usuario fue desactivado en el sistema |
| `CORS_ERROR` | 403 | Origen web no permitido |
| `NOT_FOUND` | 404 | Endpoint o ruta no encontrada |
| `TOO_MANY_REQUESTS` | 429 | Límite de tasa de solicitudes excedido |
| `INTERNAL_SERVER_ERROR` | 500 | Error no controlado (sin stack trace en producción) |

---

## 🏛️ Arquitectura por capas

```text
backend/
├── src/
│   ├── config/         # Variables de entorno validadas con Zod y constantes del sistema
│   ├── db/             # Pool de pg, transacciones con withTransaction y health check
│   ├── middlewares/    # requireAuth, validateBody, rateLimiters, notFound, errorHandler
│   ├── modules/
│   │   └── auth/       # Módulo auth (routes -> controller -> service -> repository -> schemas)
│   ├── utils/          # AppError, asyncHandler, helpers de JWT y bcrypt
│   ├── routes/         # index.js: router principal que agrupa módulos bajo /api
│   ├── app.js          # Configuración de Express, middlewares y políticas de seguridad
│   └── server.js       # Arranque seguro, comprobación de BD y Graceful Shutdown
├── scripts/
│   └── seed-admin.js   # Inicialización idempotente de usuario administrador
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
