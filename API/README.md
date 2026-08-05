# FitManager API

API sencilla para administrar usuarios, miembros, pagos, asistencias y entrenadores de FitManager.

## Tecnologías utilizadas

- Node.js
- Express
- MySQL
- mysql2
- bcryptjs
- dotenv
- cors

## Instalación

Entrar a la carpeta de la API:

```bash
cd API
```

Instalar dependencias:

```bash
npm install
```

## Configuración de la base de datos

La base de datos se llama `fitmanager`.

1. Iniciar MySQL.
2. Importar el archivo:

```bash
API/sql/fitmanager_auth.sql
```

El script crea estas tablas:

- `usuarios`
- `miembros`
- `pagos`
- `asistencias`
- `entrenadores`

Si ya se tenia creada la base de datos anterior, ejecutar una sola vez:

```bash
API/sql/actualizacion_fitmanager.sql
```

Relaciones usadas:

- `pagos.miembro_id` se relaciona con `miembros.id`.
- `asistencias.miembro_id` se relaciona con `miembros.id`.
- Los miembros no se eliminan por falta de pago; cambian a estado `Inactivo`.
- Cuando se registra un pago, el miembro vuelve a estado `Activo`.

Crear un archivo `.env` dentro de `API/` con estos datos:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fitmanager
```

Si se usa XAMPP normalmente el usuario es `root` y la contraseña queda vacía.

## Ejecución de la API

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

Revisión de sintaxis:

```bash
npm run check
```

La API queda disponible en:

```text
http://localhost:3000
```

## Endpoints disponibles

### Health

- `GET /health`

### Auth

- `POST /api/auth/registro`
- `POST /api/auth/login`

### Miembros

- `GET /api/miembros`
- `GET /api/miembros/:id`
- `POST /api/miembros`
- `PUT /api/miembros/:id`
- `DELETE /api/miembros/:id`

### Pagos

- `GET /api/pagos`
- `GET /api/pagos/:id`
- `POST /api/pagos`
- `PUT /api/pagos/:id`
- `DELETE /api/pagos/:id`

### Asistencias

- `GET /api/asistencias`
- `GET /api/asistencias/:id`
- `POST /api/asistencias`
- `DELETE /api/asistencias/:id`

### Entrenadores

- `GET /api/entrenadores`
- `GET /api/entrenadores/:id`
- `POST /api/entrenadores`
- `PUT /api/entrenadores/:id`
- `DELETE /api/entrenadores/:id`

## Documentación de ejemplos JSON

Los ejemplos de entrada y salida están en:

```text
API/DOCUMENTACION_ENDPOINTS.md
```

## Estado final

La API tiene las rutas principales montadas en `src/app.js`, controladores con consultas parametrizadas y validaciones básicas. No usa JWT, no usa Swagger y mantiene una estructura simple con Express y MySQL.
