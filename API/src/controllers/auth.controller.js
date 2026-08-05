const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { enviarCorreoRestablecimiento } = require('../services/email.service');

const TIPOS_DOCUMENTO_VALIDOS = new Set([
  'Cedula de ciudadania',
  'Tarjeta de identidad',
  'Cedula de extranjeria'
]);

function limpiarUsuario(usuario) {
  return String(usuario || '').trim();
}

function limpiarTipoDocumento(tipoDocumento) {
  return String(tipoDocumento || '').trim();
}

async function registrar(req, res) {
  const usuario = limpiarUsuario(req.body.usuario);
  const contrasena = String(req.body.contrasena || '');
  const rol = req.body.rol || 'Administrador';
  const tipoDocumento = limpiarTipoDocumento(req.body.tipoDocumento);
  const correo = String(req.body.correo || '').trim().toLowerCase();

  if (!tipoDocumento || !usuario || !correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Tipo de documento, usuario, correo y contraseña son obligatorios' });
  }

  if (!TIPOS_DOCUMENTO_VALIDOS.has(tipoDocumento)) {
    return res.status(400).json({ mensaje: 'El tipo de documento no es válido' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ mensaje: 'El correo no es válido' });
  }

  try {
    const [existentes] = await pool.query(
      'SELECT id FROM usuarios WHERE documento = ? LIMIT 1',
      [usuario]
    );

    if (existentes.length > 0) {
      return res.status(409).json({ mensaje: 'El usuario ya existe' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      'INSERT INTO usuarios (tipo_documento, documento, correo, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
      [tipoDocumento, usuario, correo, hash, rol]
    );

    return res.status(201).json({ mensaje: 'Registro exitoso' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar usuario', detalle: error.message });
  }
}

async function solicitarRestablecimiento(req, res) {
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const respuestaSegura = { mensaje: 'Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.' };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ mensaje: 'Escribe un correo válido' });
  }

  try {
    const [filas] = await pool.query('SELECT id, correo FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
    if (filas.length === 0) {
      return res.status(200).json(respuestaSegura);
    }

    const usuario = filas[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const venceEn = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query('DELETE FROM password_reset_tokens WHERE usuario_id = ?', [usuario.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (usuario_id, token_hash, vence_en) VALUES (?, ?, ?)',
      [usuario.id, tokenHash, venceEn]
    );

    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5500').replace(/\/$/, '');
    await enviarCorreoRestablecimiento(usuario.correo, `${baseUrl}/restablecer-contrasena.html?token=${token}`);
    return res.status(200).json(respuestaSegura);
  } catch (error) {
    return res.status(500).json({ mensaje: 'No fue posible enviar el correo de recuperación', detalle: error.message });
  }
}

async function restablecerContrasena(req, res) {
  const token = String(req.body.token || '');
  const contrasena = String(req.body.contrasena || '');

  if (!token || contrasena.length < 6) {
    return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const [filas] = await pool.query(
      'SELECT id, usuario_id FROM password_reset_tokens WHERE token_hash = ? AND vence_en > NOW() LIMIT 1',
      [tokenHash]
    );

    if (filas.length === 0) {
      return res.status(400).json({ mensaje: 'El enlace no es válido o ya venció' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, filas[0].usuario_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [filas[0].id]);
    return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'No fue posible cambiar la contraseña', detalle: error.message });
  }
}

async function login(req, res) {
  const usuario = limpiarUsuario(req.body.usuario);
  const contrasena = String(req.body.contrasena || '');
  const tipoDocumento = limpiarTipoDocumento(req.body.tipoDocumento);

  if (!tipoDocumento || !usuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Tipo de documento, usuario y contraseña son obligatorios' });
  }

  if (!TIPOS_DOCUMENTO_VALIDOS.has(tipoDocumento)) {
    return res.status(400).json({ mensaje: 'El tipo de documento no es válido' });
  }

  try {
    const [filas] = await pool.query(
      'SELECT id, tipo_documento, documento, password_hash, rol FROM usuarios WHERE documento = ? LIMIT 1',
      [usuario]
    );

    if (filas.length === 0) {
      return res.status(401).json({ mensaje: 'Error en la autenticación' });
    }

    const usuarioDb = filas[0];
    const coincide = await bcrypt.compare(contrasena, usuarioDb.password_hash);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Error en la autenticación' });
    }

    // Las cuentas creadas antes de este cambio no tienen tipo de documento.
    // Tras validar su contraseña, se guarda el tipo que el usuario selecciona.
    if (!usuarioDb.tipo_documento) {
      await pool.query(
        'UPDATE usuarios SET tipo_documento = ? WHERE id = ?',
        [tipoDocumento, usuarioDb.id]
      );
      usuarioDb.tipo_documento = tipoDocumento;
    } else if (usuarioDb.tipo_documento !== tipoDocumento) {
      return res.status(401).json({ mensaje: 'El tipo de documento no coincide con el registro' });
    }

    return res.status(200).json({
      mensaje: 'Autenticación satisfactoria',
      usuario: {
        id: usuarioDb.id,
        tipo_documento: usuarioDb.tipo_documento,
        documento: usuarioDb.documento,
        rol: usuarioDb.rol || 'Administrador'
      }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error en login', detalle: error.message });
  }
}

module.exports = {
  registrar,
  login,
  solicitarRestablecimiento,
  restablecerContrasena
};
