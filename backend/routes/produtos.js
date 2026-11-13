const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// Middleware: permite apenas comerciante logado
function soComerciante(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    if (usuario.tipo !== 'comerciante') {
      return res.status(403).json({ erro: 'Só o comerciante pode fazer isso.' });
    }
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }
}

// 1. LISTAR PRODUTOS (GET /produtos) - Aberto para a loja
router.get('/', async (req, res) => {
  try {
    const { categoria, disponivel } = req.query;
    let sql = 'SELECT * FROM produto WHERE 1=1';
    const args = [];

    if (categoria) {
      sql += ' AND categoria = ?';
      args.push(categoria);
    }

    if (disponivel !== undefined) {
      sql += ' AND disponivel = ?';
      args.push(Number(disponivel));
    }

    sql += ' ORDER BY id ASC';

    const result = await db.execute({ sql, args });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar produtos.' });
  }
});

// 2. BUSCAR PRODUTO POR ID (GET /produtos/:id) - Aberto para a loja
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM produto WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar produto.' });
  }
});

// 3. CADASTRAR PRODUTO (POST /produtos) - Só Comerciante
router.post('/', soComerciante, async (req, res) => {
  try {
    const { nome, descricao, preco, peso, categoria, disponivel, imagem } = req.body;

    const precoNum = Number(String(preco).replace(',', '.'));
    const pesoNum =
      peso === undefined || peso === null || peso === ''
        ? null
        : Number(String(peso).replace(',', '.'));

    if (typeof nome !== 'string' || !nome.trim()) {
      return res.status(400).json({ erro: 'Informe o nome do produto.' });
    }
    if (!Number.isFinite(precoNum) || precoNum <= 0) {
      return res.status(400).json({ erro: 'Informe o preço. Ex.: 28,50' });
    }
    if (pesoNum !== null && (!Number.isFinite(pesoNum) || pesoNum <= 0)) {
      return res.status(400).json({ erro: 'Informe o peso em kg. Ex.: 5' });
    }

    const statusDisponivel =
      disponivel !== undefined ? (Number(disponivel) === 1 || disponivel === true ? 1 : 0) : 1;

    const result = await db.execute({
      sql: `INSERT INTO produto (nome, descricao, preco, peso, categoria, disponivel, imagem)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nome.trim(),
        descricao || null,
        precoNum,
        pesoNum,
        categoria || null,
        statusDisponivel,
        imagem || null,
      ],
    });

    res.status(201).json({
      mensagem: 'Produto cadastrado com sucesso!',
      id: Number(result.lastInsertRowid),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar produto.' });
  }
});

// 4. ATUALIZAR PRODUTO (PUT /produtos/:id) - Só Comerciante
router.put('/:id', soComerciante, async (req, res) => {
  try {
    const { id } = req.params;

    const busca = await db.execute({
      sql: 'SELECT * FROM produto WHERE id = ?',
      args: [id],
    });

    if (busca.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    const atual = busca.rows[0];
    const { nome, descricao, preco, peso, categoria, disponivel, imagem } = req.body;

    const nomeFinal = nome ?? atual.nome;
    const precoBruto = preco ?? atual.preco;
    const pesoBruto = peso === '' ? null : (peso ?? atual.peso);

    const precoNum = Number(String(precoBruto).replace(',', '.'));
    const pesoNum =
      pesoBruto === undefined || pesoBruto === null || pesoBruto === ''
        ? null
        : Number(String(pesoBruto).replace(',', '.'));

    if (typeof nomeFinal !== 'string' || !nomeFinal.trim()) {
      return res.status(400).json({ erro: 'Informe o nome do produto.' });
    }
    if (!Number.isFinite(precoNum) || precoNum <= 0) {
      return res.status(400).json({ erro: 'Informe o preço. Ex.: 28,50' });
    }
    if (pesoNum !== null && (!Number.isFinite(pesoNum) || pesoNum <= 0)) {
      return res.status(400).json({ erro: 'Informe o peso em kg. Ex.: 5' });
    }

    const descricaoFinal = descricao ?? atual.descricao;
    const categoriaFinal = categoria ?? atual.categoria;
    const imagemFinal = imagem ?? atual.imagem;
    const statusDisponivel =
      disponivel !== undefined
        ? Number(disponivel) === 1 || disponivel === true
          ? 1
          : 0
        : atual.disponivel;

    await db.execute({
      sql: `UPDATE produto
            SET nome = ?, descricao = ?, preco = ?, peso = ?, categoria = ?, disponivel = ?, imagem = ?
            WHERE id = ?`,
      args: [
        nomeFinal.trim(),
        descricaoFinal,
        precoNum,
        pesoNum,
        categoriaFinal,
        statusDisponivel,
        imagemFinal,
        id,
      ],
    });

    res.json({ mensagem: 'Produto atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar produto.' });
  }
});

// 5. ALTERAR DISPONIBILIDADE (PATCH /produtos/:id/disponibilidade) - Só Comerciante
router.patch('/:id/disponibilidade', soComerciante, async (req, res) => {
  try {
    const { id } = req.params;
    const { disponivel } = req.body;

    if (disponivel !== 0 && disponivel !== 1 && typeof disponivel !== 'boolean') {
      return res.status(400).json({ erro: 'O campo disponivel deve ser 0, 1 ou booleano.' });
    }

    const novoStatus = Number(disponivel) === 1 || disponivel === true ? 1 : 0;

    const result = await db.execute({
      sql: 'UPDATE produto SET disponivel = ? WHERE id = ?',
      args: [novoStatus, id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    res.json({
      mensagem: 'Disponibilidade atualizada com sucesso!',
      disponivel: novoStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar disponibilidade.' });
  }
});

// 6. DELETAR PRODUTO (DELETE /produtos/:id) - Só Comerciante
router.delete('/:id', soComerciante, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM produto WHERE id = ?',
      args: [req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    res.json({ mensagem: 'Produto excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    if (err.message && err.message.toUpperCase().includes('FOREIGN KEY')) {
      return res.status(409).json({
        erro: 'Esse produto já aparece em pedidos. Deixe ele indisponível em vez de excluir.',
      });
    }
    res.status(500).json({ erro: 'Erro ao excluir produto.' });
  }
});

module.exports = router;