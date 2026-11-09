const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, email, senha, nome_comercio, endereco, telefone, horario } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
  }

  try {
    const existente = db.prepare('SELECT id FROM comerciante WHERE email = ?').get(email);
    if (existente) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultado = db.prepare(
      'INSERT INTO comerciante (nome, email, senha, nome_comercio, endereco, telefone, horario) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      nome,
      email,
      senhaCriptografada,
      nome_comercio || null,
      endereco || null,
      telefone || null,
      horario || null
    );

    res.status(201).json({
      mensagem: 'Comerciante cadastrado com sucesso',
      id: resultado.lastInsertRowid
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar comerciante' });
  }
});

router.post('/login', (req, res) => {
  res.json({ mensagem: 'Rota de login funcionando' });
});

module.exports = router;