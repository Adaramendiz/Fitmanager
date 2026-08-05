const express = require('express');
const { registrar, login, solicitarRestablecimiento, restablecerContrasena } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/registro', registrar);
router.post('/login', login);
router.post('/forgot-password', solicitarRestablecimiento);
router.post('/reset-password', restablecerContrasena);

module.exports = router;
