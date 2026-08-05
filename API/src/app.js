const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const miembrosRoutes = require('./routes/miembros.routes');
const pagosRoutes = require('./routes/pagos.routes');
const asistenciasRoutes = require('./routes/asistencias.routes');
const entrenadoresRoutes = require('./routes/entrenadores.routes');
const asistenciasEntrenadoresRoutes = require('./routes/asistencias-entrenadores.routes');
const { probarConexion, asegurarTipoDocumentoUsuarios } = require('./config/db');

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, servicio: 'fitmanager-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/miembros', miembrosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/entrenadores', entrenadoresRoutes);
app.use('/api/asistencias-entrenadores', asistenciasEntrenadoresRoutes);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

async function iniciarServidor() {
  try {
    await probarConexion();
    await asegurarTipoDocumentoUsuarios();
    console.log('✅ Conexión a MySQL establecida.');

    app.listen(port, () => {
      console.log(`🚀 API corriendo en http://localhost:${port}`);
      console.log(`📌 Endpoints principales: http://localhost:${port}/api/auth, /api/miembros, /api/pagos, /api/asistencias y /api/entrenadores`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar la API:', error.message);
    process.exit(1);
  }
}

iniciarServidor();
