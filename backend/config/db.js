const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const caminhoBanco = path.join(__dirname, '..', '..', 'banco', 'carvao.db');
const caminhoSql = path.join(__dirname, '..', '..', 'banco', 'criar_banco.sql');

const bancoJaExiste = fs.existsSync(caminhoBanco);

const db = new Database(caminhoBanco);
db.pragma('foreign_keys = ON');

if (!bancoJaExiste) {
  db.exec(fs.readFileSync(caminhoSql, 'utf8'));
  console.log('Banco criado a partir do criar_banco.sql');
}

module.exports = db;