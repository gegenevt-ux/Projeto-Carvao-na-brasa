require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const umaLinha = async (sql, args = []) => (await db.execute({ sql, args })).rows[0];

router.post('/cadastro', async (req, res) => {
  const { nome, email, whatsapp, senha } = req.body;

  if (!nome || !email || !whatsapp || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail, WhatsApp e senha são obrigatórios' });
  }

  try {
    const jaExiste =
      (await umaLinha('SELECT id FROM cliente WHERE email = ?', [email])) ||
      (await umaLinha('SELECT id FROM comerciante WHERE email = ?', [email]));

    if (jaExiste) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultado = await db.execute({
      sql: 'INSERT INTO cliente (nome, email, senha, whatsapp) VALUES (?, ?, ?, ?)',
      args: [nome, email, senhaCriptografada, whatsapp]
    });

    res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso',
      id: Number(resultado.lastInsertRowid)
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
    const comerciante = await umaLinha(
      'SELECT id, nome, email, senha FROM comerciante WHERE email = ?', [email]
    );

    const cliente = comerciante
      ? null
      : await umaLinha('SELECT id, nome, email, senha FROM cliente WHERE email = ?', [email]);

    const usuario = comerciante || cliente;
    const tipo = comerciante ? 'comerciante' : 'cliente';

    const senhaConfere = usuario && await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: Number(usuario.id), email: usuario.email, tipo },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      tipo,
      usuario: { id: Number(usuario.id), nome: usuario.nome, email: usuario.email }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;