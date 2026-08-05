const express = require('express');
const {
  listarMiembros,
  obtenerMiembro,
  crearMiembro,
  actualizarMiembro,
  inactivarMiembro,
  activarMiembro
} = require('../controllers/miembros.controller');

const router = express.Router();

router.get('/', listarMiembros);
router.get('/:id', obtenerMiembro);
router.post('/', crearMiembro);
router.put('/:id', actualizarMiembro);
router.patch('/:id/inactivar', inactivarMiembro);
router.patch('/:id/activar', activarMiembro);

module.exports = router;
