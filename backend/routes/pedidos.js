const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { autenticar, soCliente, soComerciante } = require('../middlewares/auth');

const router = express.Router();

const TAXA_ENTREGA = 8.0;
const MAX_QUANTIDADE = 20;

// Quais mudanças de status são permitidas
const TRANSICOES = {
  pendente: ['preparando', 'cancelado'],
  preparando: ['pronto', 'cancelado'],
  pronto: ['concluido'],
  concluido: [],
  cancelado: [],
};

const centavos = (v) => Math.round(v * 100) / 100;
const consultar = async (sql, args = []) => (await db.execute({ sql, args })).rows;
const umaLinha = async (sql, args = []) => (await consultar(sql, args))[0];

// Código de 4 números que o cliente fala na hora de receber (ou retirar) o pedido
const novoCodigo = () => String(crypto.randomInt(1000, 10000));
// O Pedro não vê o código no painel: ele precisa ouvir do cliente
const semCodigo = ({ codigo_entrega, ...pedido }) => pedido;

// Fila: um pedido é gravado por vez
let fila = Promise.resolve();
function emTransacao(trabalho) {
  const vez = fila.then(async () => {
    const tx = await db.transaction('write');
    try {
      const resultado = await trabalho(tx);
      await tx.commit();
      return resultado;
    } catch (err) {
      await tx.rollback().catch(() => {});
      throw err;
    } finally {
      tx.close();
    }
  });
  fila = vez.catch(() => {});
  return vez;
}

// Anexa os itens (com nome e peso do produto) a cada pedido
async function comItens(pedidos) {
  if (pedidos.length === 0) return [];
  const ids = pedidos.map((p) => Number(p.id));
  const marcadores = ids.map(() => '?').join(',');
  const itens = await consultar(
    `SELECT i.pedido_id, i.produto_id, i.quantidade, i.preco_unitario, pr.nome, pr.peso
     FROM item_pedido i JOIN produto pr ON pr.id = i.produto_id
     WHERE i.pedido_id IN (${marcadores})`,
    ids
  );
  return pedidos.map((p) => ({
    ...p,
    itens: itens.filter((i) => Number(i.pedido_id) === Number(p.id)),
  }));
}

// POST /pedidos: cliente logado cria um pedido
router.post('/', soCliente, async (req, res) => {
  const cliente_id = req.usuario.id; // vem do token, nunca do corpo
  const { recebimento, endereco_entrega, bairro, observacao, itens, forma_pagamento, troco_para } = req.body || {};
  
  // Como o cliente vai pagar: Pix pelo site, ou dinheiro/cartão na entrega ou na retirada
  if (!['pix', 'dinheiro', 'cartao'].includes(forma_pagamento)) {
    return res.status(400).json({ erro: 'Escolha a forma de pagamento: pix, dinheiro ou cartão.' });
  }
  // Troco só faz sentido no dinheiro, e é opcional (vazio = não precisa de troco)
  const troco = forma_pagamento === 'dinheiro' && troco_para !== undefined && troco_para !== null && troco_para !== ''
    ? Number(troco_para) : null;
  if (troco !== null && !(Number.isFinite(troco) && troco > 0)) {
    return res.status(400).json({ erro: 'Informe um valor de troco válido.' });
  }
  
  if (!['entrega', 'retirada'].includes(recebimento)) {
    return res.status(400).json({ erro: 'O recebimento deve ser "entrega" ou "retirada".' });
  }
  const entrega = recebimento === 'entrega';
  if (entrega && (!String(endereco_entrega || '').trim() || !String(bairro || '').trim())) {
    return res.status(400).json({ erro: 'Endereço e bairro são obrigatórios para entrega.' });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido precisa ter pelo menos um item.' });
  }
  for (const item of itens) {
    if (!Number.isInteger(item.produto_id) || !Number.isInteger(item.quantidade)
        || item.quantidade < 1 || item.quantidade > MAX_QUANTIDADE) {
      return res.status(400).json({ erro: `Cada item precisa de um produto e quantidade de 1 a ${MAX_QUANTIDADE}.` });
    }
  }

  // Junta produtos repetidos
  const quantidades = new Map();
  for (const item of itens) {
    quantidades.set(item.produto_id, (quantidades.get(item.produto_id) || 0) + item.quantidade);
  }
  // Depois de juntar, a soma também não pode estourar o limite
  for (const q of quantidades.values()) {
    if (q > MAX_QUANTIDADE) {
      return res.status(400).json({ erro: `Máximo de ${MAX_QUANTIDADE} unidades por produto.` });
    }
  }
  const produtoIds = [...quantidades.keys()];

  try {
    const marcadores = produtoIds.map(() => '?').join(',');
    const produtos = await consultar(
      `SELECT id, nome, preco FROM produto WHERE disponivel = 1 AND id IN (${marcadores})`,
      produtoIds
    );
    if (produtos.length !== produtoIds.length) {
      return res.status(400).json({ erro: 'Um ou mais produtos não existem ou estão indisponíveis.' });
    }

    const itensComPreco = produtos.map((p) => ({
      produto_id: Number(p.id),
      nome: p.nome,
      quantidade: quantidades.get(Number(p.id)),
      preco_unitario: Number(p.preco),
    }));
    const subtotal = centavos(itensComPreco.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0));
    const taxa = entrega ? TAXA_ENTREGA : 0;
    const total = centavos(subtotal + taxa);
    
    if (troco !== null && troco < total) {
      return res.status(400).json({ erro: `O troco precisa ser para um valor maior ou igual ao total (R$ ${total.toFixed(2).replace('.', ',')}).` });
    }

    const pedidoId = await emTransacao(async (tx) => {
      const pedido = await tx.execute({
       sql: `INSERT INTO pedido (cliente_id, recebimento, endereco_entrega, bairro, taxa_entrega, observacao, forma_pagamento, troco_para, codigo_entrega, total, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
        args: [
          cliente_id, recebimento,
          entrega ? endereco_entrega.trim() : null,
          entrega ? bairro.trim() : null,
          taxa,
          String(observacao || '').trim().slice(0, 200) || null,
          forma_pagamento,
          troco !== null ? centavos(troco) : null,
          novoCodigo(),
          total,
        ],
      });
      const id = Number(pedido.lastInsertRowid);
      for (const item of itensComPreco) {
        await tx.execute({
          sql: 'INSERT INTO item_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
          args: [id, item.produto_id, item.quantidade, item.preco_unitario],
        });
      }
      return id;
    });

    res.status(201).json({
      mensagem: 'Pedido criado com sucesso!',
      pedido_id: pedidoId,
      subtotal,
      taxa_entrega: taxa,
      total,
      itens: itensComPreco,
    });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ erro: 'Não foi possível criar o pedido. Tente de novo.' });
  }
});

// GET /pedidos/meus: pedidos do cliente logado
// (precisa vir ANTES de "/:id", senão "meus" seria tratado como um id)
router.get('/meus', soCliente, async (req, res) => {
  try {
    const pedidos = await consultar(
      'SELECT * FROM pedido WHERE cliente_id = ? ORDER BY data DESC, id DESC',
      [req.usuario.id]
    );
    res.json(await comItens(pedidos));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível buscar seus pedidos.' });
  }
});

// GET /pedidos: todos os pedidos (só comerciante). Aceita ?status=pendente
router.get('/', soComerciante, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT p.*, c.nome AS cliente_nome, c.whatsapp AS cliente_whatsapp
               FROM pedido p JOIN cliente c ON p.cliente_id = c.id`;
    const args = [];
    if (status) {
      sql += ' WHERE p.status = ?';
      args.push(status);
    }
    sql += ' ORDER BY p.data DESC, p.id DESC';
    res.json(await comItens(await consultar(sql, args))).map(semCodigo));
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível buscar os pedidos.' });
  }
});

// GET /pedidos/:id: detalhe (comerciante vê qualquer um; cliente só o seu)
router.get('/:id', autenticar, async (req, res) => {
  try {
    const pedido = await umaLinha(
      `SELECT p.*, c.nome AS cliente_nome, c.whatsapp AS cliente_whatsapp
       FROM pedido p JOIN cliente c ON p.cliente_id = c.id WHERE p.id = ?`,
      [req.params.id]
    );
    const dono = pedido && Number(pedido.cliente_id) === req.usuario.id;
    if (!pedido || (req.usuario.tipo === 'cliente' && !dono)) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }
    const completo = (await comItens([pedido]))[0];
    res.json(req.usuario.tipo === 'comerciante' ? semCodigo(completo) : completo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível buscar o pedido.' });
  }
});

// PATCH /pedidos/:id/status: comerciante muda o andamento
router.patch('/:id/status', soComerciante, async (req, res) => {
  const { status, codigo } = req.body || {};
    if(!status) return res.status(400).json({ erro: 'Informe o novo status. ' });
  try {
    const pedido = await umaLinha('SELECT id, status, codigo_entrega FROM pedido WHERE id = ?', [req.params.id]);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

    if (!(TRANSICOES[pedido.status] || []).includes(status)) {
      return res.status(400).json({
        erro: `Não é possível mudar de "${pedido.status}" para "${status}".`,
      });
    }
    
   // Para concluir, o Pedro digita o código que o cliente falou (pedidos antigos não têm código)
    if (status === 'concluido' && pedido.codigo_entrega && String(codigo || '').trim() !== pedido.codigo_entrega) {
      return res.status(400).json({ erro: 'Código de entrega não confere. Peça o código de 4 números ao cliente.' });
    }
    
    await db.execute({ sql: 'UPDATE pedido SET status = ? WHERE id = ?', args: [status, pedido.id] });
    res.json({ mensagem: 'Status atualizado!', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível atualizar o status.' });
  }
});

// PATCH /pedidos/:id/cancelar: cliente cancela o próprio pedido (só se ainda estiver pendente)
router.patch('/:id/cancelar', soCliente, async (req, res) => {
  try {
    const resultado = await db.execute({
      sql: `UPDATE pedido SET status = 'cancelado'
            WHERE id = ? AND cliente_id = ? AND status = 'pendente'`,
      args: [req.params.id, req.usuario.id],
    });
    if (resultado.rowsAffected === 0) {
      return res.status(400).json({ erro: 'Pedido não encontrado ou já não pode ser cancelado.' });
    }
    res.json({ mensagem: 'Pedido cancelado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível cancelar o pedido.' });
  }
});

// PATCH /pedidos/:id/pagar: DEMONSTRAÇÃO do Pix pelo site.
// Nenhum dinheiro de verdade passa por aqui: o botão "Já paguei" só marca o pedido como pago.
router.patch('/:id/pagar', soCliente, async (req, res) => {
  try {
    const resultado = await db.execute({
      sql: `UPDATE pedido SET pago = 1
            WHERE id = ? AND cliente_id = ? AND forma_pagamento = 'pix' AND status != 'cancelado'`,
      args: [req.params.id, req.usuario.id],
    });
    if (resultado.rowsAffected === 0) {
      return res.status(400).json({ erro: 'Este pedido não pode ser pago pelo site.' });
    }
    res.json({ mensagem: 'Pagamento registrado (demonstração).' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível registrar o pagamento.' });
  }
});

module.exports = router;
