# FitManager

Proyecto FitManager con una API en Node.js, Express y MySQL.

## Ejecución rápida

```bash
cd API
npm install
npm run dev
```

Antes de ejecutar la API se debe importar la base de datos desde:

```text
API/sql/fitmanager_auth.sql
```

Si la base de datos ya existe, ejecutar una sola vez:

```text
API/sql/actualizacion_fitmanager.sql
```

## Cambios principales

- `index.html` es la portada publica de FitManager.
- `login.html` contiene el inicio de sesion del administrador.
- Los miembros manejan `Activo` e `Inactivo`.
- Los pagos actualizan la fecha de vencimiento de la membresia.
- Si un miembro paga antes de vencer, se suma el nuevo mes a la fecha de vencimiento actual.
- El acceso valida el estado de la membresia antes de registrar asistencia.
- Los entrenadores tienen especialidad, telefono, correo y observaciones.




