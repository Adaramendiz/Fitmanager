const { pool } = require('../config/db');

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

async function existeMiembro(miembroId) {
  const [filas] = await pool.query(
    'SELECT id, estado, fecha_vencimiento FROM miembros WHERE id = ? LIMIT 1',
    [miembroId]
  );

  return filas[0];
}

async function actualizarEstadosVencidos() {
  await pool.query(
    "UPDATE miembros SET estado = 'Inactivo' WHERE fecha_vencimiento IS NULL OR fecha_vencimiento < CURDATE()"
  );
}

async function listarAsistencias(req, res) {
  try {
    await actualizarEstadosVencidos();
    // Se consultan todas las asistencias registradas
    const [filas] = await pool.query(
      `SELECT a.id, a.miembro_id, NULL AS entrenador_id, a.fecha, a.hora,
              m.nombre AS miembro_nombre, m.estado AS miembro_estado, 'Miembro' AS tipo
       FROM asistencias a INNER JOIN miembros m ON m.id = a.miembro_id
       UNION ALL
       SELECT ae.id, NULL AS miembro_id, ae.entrenador_id, ae.fecha, ae.hora,
              e.nombre AS miembro_nombre, 'Activo' AS miembro_estado, 'Entrenador' AS tipo
       FROM asistencias_entrenadores ae INNER JOIN entrenadores e ON e.id = ae.entrenador_id
       ORDER BY fecha DESC, hora DESC, id DESC`
    );

    return res.status(200).json(filas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar asistencias', detalle: error.message });
  }
}

async function obtenerAsistencia(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de asistencia inválido' });
  }

  try {
    await actualizarEstadosVencidos();
    // Se busca una asistencia por su id
    const [filas] = await pool.query(
      'SELECT id, miembro_id, fecha, hora FROM asistencias WHERE id = ? LIMIT 1',
      [id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    }

    return res.status(200).json(filas[0]);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener asistencia', detalle: error.message });
  }
}

async function crearAsistencia(req, res) {
  const { miembro_id, fecha, hora } = req.body;

  if (!miembro_id || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'Miembro, fecha y hora son obligatorios' });
  }

  if (!idValido(miembro_id)) {
    return res.status(400).json({ mensaje: 'Miembro inválido' });
  }

  try {
    await actualizarEstadosVencidos();
    const miembro = await existeMiembro(miembro_id);

    if (!miembro) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado para registrar la asistencia' });
    }

    if (miembro.estado !== 'Activo') {
      return res.status(403).json({ mensaje: 'No tiene una membresía activa.' });
    }

    // Se registra la asistencia del miembro
    const [resultado] = await pool.query(
      'INSERT INTO asistencias (miembro_id, fecha, hora) VALUES (?, ?, ?)',
      [miembro_id, fecha, hora]
    );

    return res.status(201).json({
      mensaje: 'Asistencia creada correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear asistencia', detalle: error.message });
  }
}

async function eliminarAsistencia(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de asistencia inválido' });
  }

  try {
    // Se elimina la asistencia por su id
    const [resultado] = await pool.query(
      'DELETE FROM asistencias WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Asistencia no encontrada' });
    }

    return res.status(200).json({ mensaje: 'Asistencia eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar asistencia', detalle: error.message });
  }
}

module.exports = {
  listarAsistencias,
  obtenerAsistencia,
  crearAsistencia,
  eliminarAsistencia
};
