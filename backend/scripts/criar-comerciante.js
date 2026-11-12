const bcrypt = require('bcrypt');
const db = require('../config/db');

async function main() {
  const [nome, email, senha, nomeComercio] = process.argv.slice(2);

  if (!nome || !email || !senha) {
    console.log('Uso: node scripts/criar-comerciante.js "Nome" "email" "senha" "Nome do comércio"');
    return;
  }

  const existente =
    (await db.execute({ sql: 'SELECT id FROM comerciante WHERE email = ?', args: [email] })).rows[0] ||
    (await db.execute({ sql: 'SELECT id FROM cliente WHERE email = ?', args: [email] })).rows[0];

  if (existente) {
    console.log('Já existe uma conta com esse e-mail.');
    return;
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  await db.execute({
    sql: 'INSERT INTO comerciante (nome, email, senha, nome_comercio) VALUES (?, ?, ?, ?)',
    args: [nome, email, senhaCriptografada, nomeComercio || null]
  });

  console.log('Comerciante criado com sucesso.');
}

main()
  .catch((erro) => {
    console.error('Erro:', erro.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());