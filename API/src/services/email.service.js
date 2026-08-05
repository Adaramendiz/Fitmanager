const https = require('https');

function enviarCorreoRestablecimiento(destinatario, enlace) {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.MAIL_FROM;

  if (!apiKey || !remitente) {
    return Promise.reject(new Error('Configura RESEND_API_KEY y MAIL_FROM en API/.env'));
  }

  const contenido = JSON.stringify({
    from: remitente,
    to: [destinatario],
    subject: 'Restablece tu contraseña de FitManager',
    html: `<p>Recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${enlace}">Cambiar mi contraseña</a></p><p>El enlace vence en una hora. Si no solicitaste este cambio, ignora este correo.</p>`
  });

  return new Promise((resolve, reject) => {
    const solicitud = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(contenido)
      }
    }, (respuesta) => {
      let cuerpo = '';
      respuesta.on('data', (dato) => { cuerpo += dato; });
      respuesta.on('end', () => {
        if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) return resolve();
        reject(new Error(`El servicio de correo respondió ${respuesta.statusCode}: ${cuerpo}`));
      });
    });

    solicitud.on('error', reject);
    solicitud.write(contenido);
    solicitud.end();
  });
}

module.exports = { enviarCorreoRestablecimiento };
