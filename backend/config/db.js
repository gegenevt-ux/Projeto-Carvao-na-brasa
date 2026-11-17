require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');

const usandoTurso = Boolean(process.env.TURSO_DATABASE_URL);
const arquivoLocal = path.resolve(__dirname, '../../banco/banco.db');

const db = createClient(
  usandoTurso
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: 'file:' + arquivoLocal }
);

const fs = require('fs'); // coloque no topo, junto dos outros require

db.pronto = (async () => {
  if (usandoTurso) return;
  const tabela = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='produto'");
  if (tabela.rows.length === 0) {
    const sql = fs.readFileSync(path.resolve(__dirname, '../../banco/criar_banco.sql'), 'utf8');
    await db.executeMultiple(sql);
    console.log('Banco local criado a partir de criar_banco.sql');
  }
})();

module.exports = db;