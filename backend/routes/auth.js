require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const umaLinha = async (sql, args = []) => (await db.execute({ sql, args })).rows[0];

// Confere se o valor é texto (evita erro quando chega número, lista etc.)
const ehTexto = valor => typeof valor === 'string';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* --- Limite de tentativas de login ---
   Depois de 5 senhas erradas seguidas, o mesmo e-mail (no mesmo aparelho/rede)
   fica 15 minutos sem poder tentar. Fica na memória da API: se a Vercel
   reiniciar, a contagem zera, mas dificulta quem tenta adivinhar senhas. */
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;
const tentativas = new Map();

function chaveTentativa(req, email) {
  return `${req.ip}|${email}`;
}
function estaBloqueado(chave) {
  const registro = tentativas.get(chave);
  if (!registro) return 0;
  if (registro.bloqueadoAte && registro.bloqueadoAte > Date.now()) {
    return Math.ceil((registro.bloqueadoAte - Date.now()) / 60000);
  }
  if (registro.bloqueadoAte) tentativas.delete(chave); // o bloqueio já passou
  return 0;
}
function registrarErro(chave) {
  const registro = tentativas.get(chave) || { erros: 0 };
  registro.erros += 1;
  if (registro.erros >= MAX_TENTATIVAS) registro.bloqueadoAte = Date.now() + BLOQUEIO_MS;
  tentativas.set(chave, registro);
}

router.post('/cadastro', async (req, res) => {
  const { nome, email, whatsapp, senha } = req.body || {};

  if (!nome || !email || !whatsapp || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail, WhatsApp e senha são obrigatórios' });
  }

  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim().toLowerCase();   // ANA@x.com e ana@x.com são a mesma conta
  const numeros = whatsapp.replace(/\D/g, '');

  if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
    return res.status(400).json({ erro: 'O nome precisa ter entre 3 e 100 letras' });
  }
  if (emailLimpo.length > 120 || !EMAIL_VALIDO.test(emailLimpo)) {
    return res.status(400).json({ erro: 'Digite um e-mail válido' });
  }
  if (numeros.length < 10 || numeros.length > 11) {
    return res.status(400).json({ erro: 'Digite o WhatsApp com DDD' });
  }
  if (senha.length < 6 || senha.length > 72) {
    return res.status(400).json({ erro: 'A senha precisa ter entre 6 e 72 caracteres' });
  }

  try {
    const jaExiste =
      (await umaLinha('SELECT id FROM cliente WHERE lower(email) = ?', [emailLimpo])) ||
      (await umaLinha('SELECT id FROM comerciante WHERE lower(email) = ?', [emailLimpo]));

    if (jaExiste) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const resultado = await db.execute({
      sql: 'INSERT INTO cliente (nome, email, senha, whatsapp) VALUES (?, ?, ?, ?)',
      args: [nomeLimpo, emailLimpo, senhaCriptografada, whatsapp.trim()]
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
  const { email, senha } = req.body || {};

 if (!ehTexto(email) || !ehTexto(senha) || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
  }

  const emailLimpo = email.trim().toLowerCase();
  const chave = chaveTentativa(req, emailLimpo);
  const minutos = estaBloqueado(chave);
  if (minutos) {
    return res.status(429).json({ erro: `Muitas tentativas erradas. Tente de novo em ${minutos} minuto(s).` });
  }

  try {
    const comerciante = await umaLinha(
     'SELECT id, nome, email, senha, telefone FROM comerciante WHERE lower(email) = ?', [emailLimpo]
    );

    const cliente = comerciante
      ? null
     : await umaLinha('SELECT id, nome, email, senha, whatsapp FROM cliente WHERE lower(email) = ?', [emailLimpo]);

    const usuario = comerciante || cliente;
    const tipo = comerciante ? 'comerciante' : 'cliente';

    const senhaConfere = usuario && await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      registrarErro(chave);
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

     tentativas.delete(chave);   // acertou: zera a contagem

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
