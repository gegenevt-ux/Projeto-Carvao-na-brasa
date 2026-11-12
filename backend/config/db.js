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

module.exports = db;