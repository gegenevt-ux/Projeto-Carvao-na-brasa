const express = require('express');
const router = express.Router();

router.post('/cadastro', (req, res) => {
  res.json({ mensagem: 'Rota de cadastro funcionando', recebido: req.body });
});

router.post('/login', (req, res) => {
  res.json({ mensagem: 'Rota de login funcionando' });
});

module.exports = router;