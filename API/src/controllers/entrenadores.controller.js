const { pool } = require('../config/db');

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

function soloNumeros(valor) {
  return /^\d+$/.test(String(valor || ''));
}

function correoValido(correo) {
  return !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo));
}

async function asegurarHistorialEntrenadores() {
  await pool.query(`CREATE TABLE IF NOT EXISTS historial_entrenadores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, entrenador_id INT UNSIGNED NOT NULL,
    tipo VARCHAR(40) NOT NULL, detalle TEXT NOT NULL, creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE CASCADE
  )`);
}

async function listarHistorialEntrenadores(req, res) {
  try {
    await asegurarHistorialEntrenadores();
    const [filas] = await pool.query(`SELECT h.id, h.tipo, h.detalle, h.creado_en, h.entrenador_id, e.nombre AS entrenador_nombre FROM historial_entrenadores h INNER JOIN entrenadores e ON e.id = h.entrenador_id ORDER BY h.creado_en DESC, h.id DESC`);
    return res.status(200).json(filas);
  } catch (error) { return res.status(500).json({ mensaje: 'Error al listar el historial de entrenadores', detalle: error.message }); }
}

async function listarEntrenadores(req, res) {
  try {
    // Se consultan todos los entrenadores registrados
    const [filas] = await pool.query(
      'SELECT id, nombre, numero_documento, tipo_documento, especialidad, telefono, correo, observaciones, estado FROM entrenadores ORDER BY id DESC'
    );

    return res.status(200).json(filas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar entrenadores', detalle: error.message });
  }
}

async function obtenerEntrenador(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de entrenador inválido' });
  }

  try {
    // Se busca el entrenador por su id
    const [filas] = await pool.query(
      'SELECT id, nombre, numero_documento, tipo_documento, especialidad, telefono, correo, observaciones, estado FROM entrenadores WHERE id = ? OR numero_documento = ? LIMIT 1',
      [id, id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    return res.status(200).json(filas[0]);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener entrenador', detalle: error.message });
  }
}

async function crearEntrenador(req, res) {
  const { nombre, numero_documento, tipo_documento, especialidad, telefono, correo, observaciones } = req.body;

  if (!nombre || !especialidad || !soloNumeros(numero_documento)) {
    return res.status(400).json({ mensaje: 'Nombre, documento numérico y especialidad son obligatorios' });
  }

  if (telefono && !soloNumeros(telefono)) {
    return res.status(400).json({ mensaje: 'El teléfono solo debe tener números' });
  }

  if (!correoValido(correo)) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  try {
    // Se guarda el nuevo entrenador
    const [resultado] = await pool.query(
      'INSERT INTO entrenadores (nombre, numero_documento, tipo_documento, especialidad, telefono, correo, observaciones, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, numero_documento, tipo_documento || null, especialidad, telefono || null, correo || null, observaciones || null, 'Disponible']
    );

    return res.status(201).json({
      mensaje: 'Entrenador creado correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear entrenador', detalle: error.message });
  }
}

async function actualizarEntrenador(req, res) {
  const id = req.params.id;
  const { nombre, numero_documento, tipo_documento, especialidad, telefono, correo, observaciones } = req.body;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de entrenador inválido' });
  }

  if (!nombre || !especialidad || !soloNumeros(numero_documento)) {
    return res.status(400).json({ mensaje: 'Nombre, documento numérico y especialidad son obligatorios' });
  }

  if (telefono && !soloNumeros(telefono)) {
    return res.status(400).json({ mensaje: 'El teléfono solo debe tener números' });
  }

  if (!correoValido(correo)) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  try {
    await asegurarHistorialEntrenadores();
    const [anteriores] = await pool.query('SELECT nombre, observaciones FROM entrenadores WHERE id = ? LIMIT 1', [id]);
    if (anteriores.length === 0) return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    const anterior = anteriores[0];
    // Se actualizan los datos del entrenador
    const [resultado] = await pool.query(
      'UPDATE entrenadores SET nombre = ?, numero_documento = ?, tipo_documento = ?, especialidad = ?, telefono = ?, correo = ?, observaciones = ? WHERE id = ?',
      [nombre, numero_documento, tipo_documento || null, especialidad, telefono || null, correo || null, observaciones || null, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    if (String(anterior.observaciones || '').trim() !== String(observaciones || '').trim()) {
      await pool.query('INSERT INTO historial_entrenadores (entrenador_id, tipo, detalle) VALUES (?, ?, ?)', [id, 'Observaciones', `Observaciones actualizadas para ${nombre}: ${observaciones || 'Sin observaciones'}`]);
    }

    return res.status(200).json({ mensaje: 'Entrenador actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar entrenador', detalle: error.message });
  }
}

async function eliminarEntrenador(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de entrenador inválido' });
  }

  try {
    // Se elimina el entrenador por su id
    const [resultado] = await pool.query(
      'DELETE FROM entrenadores WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Entrenador eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar entrenador', detalle: error.message });
  }
}

async function cambiarEstadoEntrenador(req, res) {
  const id = req.params.id;
  const { estado } = req.body;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de entrenador inválido' });
  }

  if (!['Disponible', 'No disponible'].includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado de entrenador inválido' });
  }

  try {
    await asegurarHistorialEntrenadores();
    const [anteriores] = await pool.query('SELECT nombre, estado FROM entrenadores WHERE id = ? LIMIT 1', [id]);
    if (anteriores.length === 0) return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    const anterior = anteriores[0];
    const [resultado] = await pool.query(
      'UPDATE entrenadores SET estado = ? WHERE id = ?',
      [estado, id]
    );

    if (anterior.estado !== estado) {
      await pool.query('INSERT INTO historial_entrenadores (entrenador_id, tipo, detalle) VALUES (?, ?, ?)', [id, 'Estado', `Estado de ${anterior.nombre} cambiado de ${anterior.estado || 'Disponible'} a ${estado}`]);
    }

    return res.status(200).json({ mensaje: `Entrenador marcado como ${estado.toLowerCase()}` });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cambiar el estado del entrenador', detalle: error.message });
  }
}

module.exports = {
  listarEntrenadores,
  obtenerEntrenador,
  crearEntrenador,
  actualizarEntrenador,
  eliminarEntrenador,
  cambiarEstadoEntrenador,
  listarHistorialEntrenadores
};
