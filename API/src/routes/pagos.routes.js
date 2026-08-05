const express = require('express');
const {
  listarPagos,
  obtenerPago,
  crearPago,
  actualizarPago,
  confirmarPago
} = require('../controllers/pagos.controller');

const router = express.Router();

router.get('/', listarPagos);
router.get('/:id', obtenerPago);
router.post('/', crearPago);
router.put('/:id', actualizarPago);
router.patch('/:id/confirmar', confirmarPago);

module.exports = router;
