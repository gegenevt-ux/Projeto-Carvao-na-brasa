require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/cadastro', async (req, res) => {
  const { nome, email, whatsapp, senha } = req.body;

  if (!nome || !email || !whatsapp || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail, WhatsApp e senha são obrigatórios' });
  }

  try {
    const jaExiste =
      db.prepare('SELECT id FROM cliente WHERE email = ?').get(email) ||
      db.prepare('SELECT id FROM comerciante WHERE email = ?').get(email);

    if (jaExiste) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultado = db
      .prepare('INSERT INTO cliente (nome, email, senha, whatsapp) VALUES (?, ?, ?, ?)')
      .run(nome, email, senhaCriptografada, whatsapp);

    res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso',
      id: resultado.lastInsertRowid
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const comerciante = db
      .prepare('SELECT id, nome, email, senha FROM comerciante WHERE email = ?')
      .get(email);

    const cliente = comerciante
      ? null
      : db.prepare('SELECT id, nome, email, senha FROM cliente WHERE email = ?').get(email);

    const usuario = comerciante || cliente;
    const tipo = comerciante ? 'comerciante' : 'cliente';

    const senhaConfere = usuario && await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      tipo,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;