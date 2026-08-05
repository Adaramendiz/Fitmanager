const { pool } = require('../config/db');

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

async function listarAsistenciasEntrenadores(req, res) {
  try {
    const [filas] = await pool.query(
      `SELECT a.id, a.entrenador_id, a.fecha, a.hora, e.nombre AS entrenador_nombre
       FROM asistencias_entrenadores a
       INNER JOIN entrenadores e ON e.id = a.entrenador_id
       ORDER BY a.fecha DESC, a.hora DESC, a.id DESC`
    );
    return res.status(200).json(filas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar asistencias de entrenadores', detalle: error.message });
  }
}

async function crearAsistenciaEntrenador(req, res) {
  const { entrenador_id, fecha, hora } = req.body;
  if (!idValido(entrenador_id) || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'Entrenador, fecha y hora son obligatorios' });
  }
  try {
    const [entrenadores] = await pool.query('SELECT id FROM entrenadores WHERE id = ? LIMIT 1', [entrenador_id]);
    if (entrenadores.length === 0) return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    const [resultado] = await pool.query(
      'INSERT INTO asistencias_entrenadores (entrenador_id, fecha, hora) VALUES (?, ?, ?)',
      [entrenador_id, fecha, hora]
    );
    return res.status(201).json({ mensaje: 'Asistencia del entrenador registrada.', id: resultado.insertId });
  } catch (error) {
    return res.status(500).json({ mensaje: 'No se pudo registrar la asistencia del entrenador', detalle: error.message });
  }
}

module.exports = { listarAsistenciasEntrenadores, crearAsistenciaEntrenador };
