const express = require('express');
const {
  listarEntrenadores,
  obtenerEntrenador,
  crearEntrenador,
  actualizarEntrenador,
  cambiarEstadoEntrenador,
  listarHistorialEntrenadores
} = require('../controllers/entrenadores.controller');

const router = express.Router();

router.get('/', listarEntrenadores);
router.get('/historial', listarHistorialEntrenadores);
router.get('/:id', obtenerEntrenador);
router.post('/', crearEntrenador);
router.put('/:id', actualizarEntrenador);
router.patch('/:id/estado', cambiarEstadoEntrenador);

module.exports = router;
