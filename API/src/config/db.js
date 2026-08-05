const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fitmanager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function probarConexion() {
  const conexion = await pool.getConnection();
  await conexion.ping();
  conexion.release();
}

async function asegurarTipoDocumentoUsuarios() {
  const [columnas] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME = 'tipo_documento'`
  );

  if (columnas.length === 0) {
    await pool.query('ALTER TABLE usuarios ADD COLUMN tipo_documento VARCHAR(50) NULL AFTER id');
  }

  const [correoColumnas] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME = 'correo'`
  );

  if (correoColumnas.length === 0) {
    await pool.query('ALTER TABLE usuarios ADD COLUMN correo VARCHAR(100) NULL AFTER documento');
  }

  const [direccionColumnas] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'miembros' AND COLUMN_NAME = 'direccion'`
  );
  if (direccionColumnas.length === 0) {
    await pool.query('ALTER TABLE miembros ADD COLUMN direccion VARCHAR(255) NULL AFTER correo');
  }

  const [estadoEntrenadorColumnas] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entrenadores' AND COLUMN_NAME = 'estado'`
  );
  if (estadoEntrenadorColumnas.length === 0) {
    await pool.query("ALTER TABLE entrenadores ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'Disponible' AFTER observaciones");
  }

  const [documentoEntrenadorColumnas] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'entrenadores' AND COLUMN_NAME = 'numero_documento'`
  );
  if (documentoEntrenadorColumnas.length === 0) {
    await pool.query('ALTER TABLE entrenadores ADD COLUMN numero_documento VARCHAR(50) NULL AFTER nombre');
    await pool.query('ALTER TABLE entrenadores ADD COLUMN tipo_documento VARCHAR(50) NULL AFTER numero_documento');
    await pool.query('UPDATE entrenadores SET numero_documento = id WHERE numero_documento IS NULL');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      vence_en DATETIME NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

  const columnasPagos = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos'`
  );
  const nombresPagos = new Set(columnasPagos[0].map((columna) => columna.COLUMN_NAME));
  if (!nombresPagos.has('estado')) {
    await pool.query("ALTER TABLE pagos ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' AFTER membresia");
    await pool.query("UPDATE pagos SET estado = 'Confirmado'");
  }
  if (!nombresPagos.has('cliente_nombre')) {
    await pool.query('ALTER TABLE pagos ADD COLUMN cliente_nombre VARCHAR(100) NULL AFTER miembro_id');
  }
  if (!nombresPagos.has('cliente_documento')) {
    await pool.query('ALTER TABLE pagos ADD COLUMN cliente_documento VARCHAR(50) NULL AFTER cliente_nombre');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS asistencias_entrenadores (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      entrenador_id INT UNSIGNED NOT NULL,
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      CONSTRAINT fk_asistencia_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE RESTRICT
    )
  `);
}

module.exports = {
  pool,
  probarConexion,
  asegurarTipoDocumentoUsuarios
};
