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

async function actualizarEstadosVencidos() {
  await pool.query(
    "UPDATE miembros SET estado = 'Inactivo' WHERE fecha_vencimiento IS NULL OR fecha_vencimiento < CURDATE()"
  );
}

async function listarMiembros(req, res) {
  try {
    await actualizarEstadosVencidos();
    // Se consultan todos los miembros registrados
    const [filas] = await pool.query(
      'SELECT id, nombre, documento, telefono, correo, direccion, fecha_registro, estado, fecha_vencimiento, plan, membresia FROM miembros ORDER BY id DESC'
    );

    return res.status(200).json(filas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar miembros', detalle: error.message });
  }
}

async function obtenerMiembro(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de miembro inválido' });
  }

  try {
    await actualizarEstadosVencidos();
    // Se busca el miembro por su id
    const [filas] = await pool.query(
      'SELECT id, nombre, documento, telefono, correo, direccion, fecha_registro, estado, fecha_vencimiento, plan, membresia FROM miembros WHERE id = ? LIMIT 1',
      [id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado' });
    }

    return res.status(200).json(filas[0]);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener miembro', detalle: error.message });
  }
}

async function crearMiembro(req, res) {
  const { nombre, documento, telefono, correo, direccion, fecha_registro } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ mensaje: 'Nombre y documento son obligatorios' });
  }

  if (!soloNumeros(documento)) {
    return res.status(400).json({ mensaje: 'El documento solo debe tener números' });
  }

  if (telefono && !soloNumeros(telefono)) {
    return res.status(400).json({ mensaje: 'El teléfono solo debe tener números' });
  }

  if (!correoValido(correo)) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  try {
    // Se guarda el nuevo miembro en la base de datos
    const [resultado] = await pool.query(
      'INSERT INTO miembros (nombre, documento, telefono, correo, direccion, fecha_registro, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, documento, telefono || null, correo || null, direccion || null, fecha_registro || null, 'Inactivo']
    );

    return res.status(201).json({
      mensaje: 'Miembro creado correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El documento ya está registrado' });
    }

    return res.status(500).json({ mensaje: 'Error al crear miembro', detalle: error.message });
  }
}

async function actualizarMiembro(req, res) {
  const id = req.params.id;
  const { nombre, documento, telefono, correo, direccion, fecha_registro } = req.body;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de miembro inválido' });
  }

  if (!nombre || !documento) {
    return res.status(400).json({ mensaje: 'Nombre y documento son obligatorios' });
  }

  if (!soloNumeros(documento)) {
    return res.status(400).json({ mensaje: 'El documento solo debe tener números' });
  }

  if (telefono && !soloNumeros(telefono)) {
    return res.status(400).json({ mensaje: 'El teléfono solo debe tener números' });
  }

  if (!correoValido(correo)) {
    return res.status(400).json({ mensaje: 'Correo inválido' });
  }

  try {
    // Se actualizan los datos del miembro seleccionado
    const [resultado] = await pool.query(
      'UPDATE miembros SET nombre = ?, documento = ?, telefono = ?, correo = ?, direccion = ?, fecha_registro = ? WHERE id = ?',
      [nombre, documento, telefono || null, correo || null, direccion || null, fecha_registro || null, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Miembro actualizado correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'El documento ya está registrado' });
    }

    return res.status(500).json({ mensaje: 'Error al actualizar miembro', detalle: error.message });
  }
}

async function inactivarMiembro(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de miembro inválido' });
  }

  try {
    const [resultado] = await pool.query(
      "UPDATE miembros SET estado = 'Inactivo' WHERE id = ?",
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Miembro inactivado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al inactivar miembro', detalle: error.message });
  }
}

async function activarMiembro(req, res) {
  const id = req.params.id;
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id de miembro inválido' });
  try {
    const [resultado] = await pool.query("UPDATE miembros SET estado = 'Activo' WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Miembro no encontrado' });
    return res.status(200).json({ mensaje: 'Miembro activado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al activar miembro', detalle: error.message });
  }
}

async function eliminarMiembro(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de miembro inválido' });
  }

  let conexion;

  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    await conexion.query('DELETE FROM asistencias WHERE miembro_id = ?', [id]);
    await conexion.query('DELETE FROM pagos WHERE miembro_id = ?', [id]);

    const [resultado] = await conexion.query(
      'DELETE FROM miembros WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      await conexion.rollback();
      return res.status(404).json({ mensaje: 'Miembro no encontrado' });
    }

    await conexion.commit();

    return res.status(200).json({ mensaje: 'Miembro eliminado correctamente' });
  } catch (error) {
    if (conexion) {
      await conexion.rollback();
    }

    return res.status(500).json({ mensaje: 'Error al eliminar miembro', detalle: error.message });
  } finally {
    if (conexion) {
      conexion.release();
    }
  }
}

module.exports = {
  listarMiembros,
  obtenerMiembro,
  crearMiembro,
  actualizarMiembro,
  inactivarMiembro,
  activarMiembro,
  eliminarMiembro
};
