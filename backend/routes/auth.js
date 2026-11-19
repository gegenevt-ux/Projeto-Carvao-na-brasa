require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const umaLinha = async (sql, args = []) => (await db.execute({ sql, args })).rows[0];

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

router.post('/cadastro', async (req, res) => {
  const corpo = req.body || {};
  const nome = texto(corpo.nome);
  const email = texto(corpo.email).toLowerCase();
  const whatsapp = texto(corpo.whatsapp);
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

  if (!nome || !email || !whatsapp || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail, WhatsApp e senha são obrigatórios' });
  }
  if (nome.length < 3 || nome.length > 100) {
    return res.status(400).json({ erro: 'O nome deve ter entre 3 e 100 caracteres' });
  }
  if (email.length > 254 || !EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ erro: 'Informe um e-mail válido' });
  }
  const digitos = whatsapp.replace(/\D/g, '');
  if (whatsapp.length > 20 || digitos.length < 10 || digitos.length > 11) {
    return res.status(400).json({ erro: 'Informe o WhatsApp com DDD. Ex.: (69) 99999-9999' });
  }
  if (senha.length < 6 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha deve ter entre 6 e 72 caracteres' });
  }

  try {
    const jaExiste =
      (await umaLinha('SELECT id FROM cliente WHERE lower(email) = ?', [email])) ||
      (await umaLinha('SELECT id FROM comerciante WHERE lower(email) = ?', [email]));

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
  const corpo = req.body || {};
  const email = texto(corpo.email).toLowerCase();
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const comerciante = await umaLinha(
      'SELECT id, nome, email, senha, telefone FROM comerciante WHERE lower(email) = ?', [email]
    );

    const cliente = comerciante
      ? null
      : await umaLinha('SELECT id, nome, email, senha, whatsapp FROM cliente WHERE lower(email) = ?', [email]);

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
      usuario: {
        id: Number(usuario.id),
        nome: usuario.nome,
        email: usuario.email,
        whatsapp: comerciante ? usuario.telefone : usuario.whatsapp
      }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

module.exports = router;