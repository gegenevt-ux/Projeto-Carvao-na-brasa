const express = require('express');
const db = require('../config/db');
const { soComerciante } = require( '../middlewares/auth');

const router = express.Router();

// Só essas informações podem aparecer no site.
const CAMPOS = ['nome_comercio', 'endereco', 'telefone', 'horario'];

// GET /comercio: mostra os dados da loja (qualquer pessoa pode ver)
router.get('/', async (req, res) => {
  try {
    const busca = await db.execute(
      'SELECT nome_comercio, endereco, telefone, horario FROM comerciante ORDER BY id LIMIT 1'
    );
    if (busca.rows.length === 0) {
      return res.status(404).json({ erro: 'Dados da loja ainda não cadastrados.' });
    }
    res.json(busca.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados da loja:', err);
    res.status(500).json({ erro: 'Não foi possível buscar os dados da loja.' });
  }
});

// PUT /comercio: o Pedro atualiza os dados da loja
// Só muda o que foi enviado; o resto continua como estava.
router.put('/', soComerciante, async (req, res) => {
  try {
    const busca = await db.execute({
      sql: 'SELECT nome_comercio, endereco, telefone, horario FROM comerciante WHERE id = ?',
      args: [req.usuario.id],
    });
    if (busca.rows.length === 0) {
      return res.status(404).json({ erro: 'Comerciante não encontrado.' });
    }

    const atual = busca.rows[0];
    const novo = {};
    for (const campo of CAMPOS) {
      const valor = (req.body || {})[campo];
      if (valor === undefined) {
        novo[campo] = atual[campo];
      } else if (typeof valor !== 'string' || valor.trim().length > 200) {
        return res.status(400).json({ erro: `O campo ${campo} precisa ser um texto de até 200 letras.` });
      } else {
        novo[campo] = valor.trim() || null;
      }
    }

    await db.execute({
      sql: 'UPDATE comerciante SET nome_comercio = ?, endereco = ?, telefone = ?, horario = ? WHERE id = ?',
      args: [novo.nome_comercio, novo.endereco, novo.telefone, novo.horario, req.usuario.id],
    });

    res.json({ mensagem: 'Dados da loja atualizados!', ...novo });
  } catch (err) {
    console.error('Erro ao atualizar dados da loja:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar os dados da loja.' });
  }
});

module.exports = router;
