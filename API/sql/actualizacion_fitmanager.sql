USE fitmanager;

ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'Administrador';

ALTER TABLE miembros ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'Inactivo';
ALTER TABLE miembros ADD COLUMN fecha_vencimiento DATE;
ALTER TABLE miembros ADD COLUMN plan VARCHAR(50);
ALTER TABLE miembros ADD COLUMN membresia VARCHAR(50);
ALTER TABLE miembros ADD COLUMN direccion VARCHAR(255);

ALTER TABLE pagos ADD COLUMN plan VARCHAR(50);
ALTER TABLE pagos ADD COLUMN membresia VARCHAR(50) DEFAULT 'Mensual';

ALTER TABLE entrenadores ADD COLUMN observaciones TEXT;
ALTER TABLE entrenadores ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'Disponible';
