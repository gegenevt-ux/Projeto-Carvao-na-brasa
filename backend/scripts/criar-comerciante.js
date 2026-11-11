const bcrypt = require('bcrypt');
const db = require('../config/db');

const [nome, email, senha, nomeComercio] = process.argv.slice(2);

if (!nome || !email || !senha) {
  console.log('Uso: node scripts/criar-comerciante.js "Nome" "email" "senha" "Nome do comércio"');
  process.exit(1);
}

const existente = db.prepare('SELECT id FROM comerciante WHERE email = ?').get(email);
if (existente) {
  console.log('Já existe um comerciante com esse e-mail.');
  process.exit(1);
}

const senhaCriptografada = bcrypt.hashSync(senha, 10);

db.prepare(
  'INSERT INTO comerciante (nome, email, senha, nome_comercio) VALUES (?, ?, ?, ?)'
).run(nome, email, senhaCriptografada, nomeComercio || null);

console.log('Comerciante criado com sucesso.');