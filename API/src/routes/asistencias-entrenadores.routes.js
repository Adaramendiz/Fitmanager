const express = require('express');
const { listarAsistenciasEntrenadores, crearAsistenciaEntrenador } = require('../controllers/asistencias-entrenadores.controller');

const router = express.Router();
router.get('/', listarAsistenciasEntrenadores);
router.post('/', crearAsistenciaEntrenador);

module.exports = router;
