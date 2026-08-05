const express = require('express');
const {
  listarAsistencias,
  obtenerAsistencia,
  crearAsistencia
} = require('../controllers/asistencias.controller');

const router = express.Router();

router.get('/', listarAsistencias);
router.get('/:id', obtenerAsistencia);
router.post('/', crearAsistencia);

module.exports = router;
