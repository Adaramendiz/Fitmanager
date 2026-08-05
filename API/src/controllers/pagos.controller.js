const { pool } = require('../config/db');

function idValido(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

function valorValido(valor) {
  return !Number.isNaN(Number(valor)) && Number(valor) > 0;
}

function mesesPorMembresia(membresia) {
  if (membresia === '2 meses' || membresia === '2 Meses') return 2;
  if (membresia === 'Anual') return 12;
  return 1;
}

function precioPorPlan(plan) {
  return {
    'Plan Elite': 120000,
    'Plan Pro': 100000,
    'Plan Basic': 85000
  }[plan] || null;
}

async function existeMiembro(miembroId) {
  const [filas] = await pool.query(
    'SELECT id FROM miembros WHERE id = ? LIMIT 1',
    [miembroId]
  );

  return filas.length > 0;
}

async function listarPagos(req, res) {
  try {
    // Se consultan todos los pagos registrados
    const [filas] = await pool.query(
      `SELECT p.id, p.miembro_id, p.cliente_nombre, p.cliente_documento, p.valor, p.fecha_pago, p.metodo_pago, p.plan, p.membresia, p.estado,
              COALESCE(m.nombre, p.cliente_nombre) AS miembro_nombre, m.correo AS miembro_correo
       FROM pagos p
       LEFT JOIN miembros m ON m.id = p.miembro_id
       ORDER BY p.id DESC`
    );

    return res.status(200).json(filas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar pagos', detalle: error.message });
  }
}

async function obtenerPago(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de pago inválido' });
  }

  try {
    // Se busca el pago por su id
    const [filas] = await pool.query(
      'SELECT id, miembro_id, cliente_nombre, cliente_documento, valor, fecha_pago, metodo_pago, plan, membresia, estado FROM pagos WHERE id = ? LIMIT 1',
      [id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    return res.status(200).json(filas[0]);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener pago', detalle: error.message });
  }
}

async function crearPago(req, res) {
  const { miembro_id, valor, fecha_pago, metodo_pago, plan, membresia } = req.body;
  const valorPlan = precioPorPlan(plan);

  if (!miembro_id || !valor || !fecha_pago || !metodo_pago) {
    return res.status(400).json({ mensaje: 'Miembro, valor, fecha de pago y método de pago son obligatorios' });
  }

  if (!idValido(miembro_id) || !valorValido(valor) || !valorPlan) {
    return res.status(400).json({ mensaje: 'Miembro, plan o valor inválido' });
  }

  try {
    if (!(await existeMiembro(miembro_id))) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado para registrar el pago' });
    }

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const [miembros] = await conexion.query(
        'SELECT id, nombre, documento, fecha_vencimiento FROM miembros WHERE id = ? LIMIT 1',
        [miembro_id]
      );

      const miembro = miembros[0];
      const [resultado] = await conexion.query(
        `INSERT INTO pagos (miembro_id, cliente_nombre, cliente_documento, valor, fecha_pago, metodo_pago, plan, membresia, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [miembro_id, miembro.nombre, miembro.documento, valorPlan, fecha_pago, metodo_pago, plan, membresia || 'Mensual']
      );

      await conexion.commit();
      conexion.release();

      return res.status(201).json({
        mensaje: 'Pago registrado. Confirma la llegada del dinero para habilitar la membresía.',
        id: resultado.insertId
      });
    } catch (error) {
      await conexion.rollback();
      conexion.release();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear pago', detalle: error.message });
  }
}

async function confirmarPago(req, res) {
  const id = req.params.id;
  if (!idValido(id)) return res.status(400).json({ mensaje: 'Id de pago inválido' });

  let conexion;
  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();
    const [pagos] = await conexion.query('SELECT * FROM pagos WHERE id = ? FOR UPDATE', [id]);
    if (pagos.length === 0) {
      await conexion.rollback();
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }
    const pago = pagos[0];
    if (pago.estado === 'Confirmado') {
      await conexion.rollback();
      return res.status(200).json({ mensaje: 'El pago ya estaba confirmado.' });
    }
    const meses = mesesPorMembresia(pago.membresia);
    await conexion.query(
      `UPDATE miembros SET estado = 'Activo', plan = COALESCE(?, plan), membresia = ?,
       fecha_vencimiento = DATE_ADD(CASE WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento >= ? THEN fecha_vencimiento ELSE ? END, INTERVAL ? MONTH)
       WHERE id = ?`,
      [pago.plan || null, pago.membresia || 'Mensual', pago.fecha_pago, pago.fecha_pago, meses, pago.miembro_id]
    );
    await conexion.query("UPDATE pagos SET estado = 'Confirmado' WHERE id = ?", [id]);
    await conexion.commit();
    return res.status(200).json({ mensaje: 'Pago confirmado y membresía habilitada.' });
  } catch (error) {
    if (conexion) await conexion.rollback();
    return res.status(500).json({ mensaje: 'No se pudo confirmar el pago', detalle: error.message });
  } finally {
    if (conexion) conexion.release();
  }
}

async function actualizarPago(req, res) {
  const id = req.params.id;
  const { miembro_id, valor, fecha_pago, metodo_pago, plan, membresia } = req.body;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de pago inválido' });
  }

  if (!miembro_id || !valor || !fecha_pago || !metodo_pago) {
    return res.status(400).json({ mensaje: 'Miembro, valor, fecha de pago y método de pago son obligatorios' });
  }

  if (!idValido(miembro_id) || !valorValido(valor)) {
    return res.status(400).json({ mensaje: 'Miembro o valor inválido' });
  }

  try {
    if (!(await existeMiembro(miembro_id))) {
      return res.status(404).json({ mensaje: 'Miembro no encontrado para actualizar el pago' });
    }

    // Se actualiza el pago seleccionado
    const [resultado] = await pool.query(
      'UPDATE pagos SET miembro_id = ?, valor = ?, fecha_pago = ?, metodo_pago = ?, plan = ?, membresia = ? WHERE id = ?',
      [miembro_id, valor, fecha_pago, metodo_pago, plan || null, membresia || 'Mensual', id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Pago actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar pago', detalle: error.message });
  }
}

async function eliminarPago(req, res) {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'Id de pago inválido' });
  }

  try {
    // Se elimina el pago por su id
    const [resultado] = await pool.query(
      'DELETE FROM pagos WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Pago no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar pago', detalle: error.message });
  }
}

module.exports = {
  listarPagos,
  obtenerPago,
  crearPago,
  actualizarPago,
  confirmarPago
};
