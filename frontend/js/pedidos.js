/* =========================================================
   PEDIDOS.JS — criar e listar pedidos do cliente
   ---------------------------------------------------------
   ⚠️ SIMULAÇÃO com localStorage. No sistema real:
     - criarPedido()  vira  POST /api/pedidos
     - meusPedidos()  vira  GET  /api/pedidos?cliente=ID
   Os campos seguem as tabelas "pedido" e "item_pedido":
   recebimento ('entrega' | 'retirada'), endereco_entrega,
   bairro, taxa_entrega, observacao, total, status, data.
   ========================================================= */

const CHAVE_PEDIDOS = 'carvao_pedidos';

/* Os 4 passos da linha do tempo, na ordem.
   Os nomes de status são os mesmos do CHECK do banco. */
const ETAPAS = [
  { status: 'pendente',   rotulo: 'Pedido enviado' },
  { status: 'preparando', rotulo: 'Preparando' },
  { status: 'pronto',     rotulo: 'Pronto' },
  { status: 'concluido',  rotulo: 'Concluído' }
];

/* Como cada status aparece na tela */
const STATUS = {
  pendente:   { rotulo: 'Pendente',   badge: 'badge-laranja',  mensagem: 'Aguardando confirmação da loja. Seu pedido foi enviado.' },
  preparando: { rotulo: 'Preparando', badge: 'badge-laranja',  mensagem: 'A loja já está separando o seu carvão.' },
  pronto:     { rotulo: 'Pronto',     badge: 'badge-verde',    mensagem: '' },  // depende de entrega/retirada
  concluido:  { rotulo: 'Concluído',  badge: 'badge-verde',    mensagem: 'Pedido entregue. Bom churrasco!' },
  cancelado:  { rotulo: 'Cancelado',  badge: 'badge-vermelho', mensagem: 'Pedido cancelado. O preparo não foi iniciado e não há valor a pagar.' }
};

/* Pedidos de exemplo do cliente demo (iguais ao protótipo),
   para a tela "Meus pedidos" não começar vazia. */
const PEDIDOS_DEMO = [
  { id: 1048, clienteId: 1, data: '2026-11-03T10:42', status: 'pendente', recebimento: 'entrega',
    itens: [{ produtoId: 2, quantidade: 2, preco: 28 }, { produtoId: 1, quantidade: 1, preco: 18 }],
    endereco_entrega: 'Rua dos Ipês, 245', bairro: 'Aponiã', taxa_entrega: 8 },
  { id: 1047, clienteId: 1, data: '2026-11-03T09:20', status: 'pronto', recebimento: 'retirada',
    itens: [{ produtoId: 2, quantidade: 2, preco: 28 }, { produtoId: 1, quantidade: 1, preco: 18 }],
    taxa_entrega: 0 },
  { id: 1046, clienteId: 1, data: '2026-11-03T08:55', status: 'preparando', recebimento: 'entrega',
    itens: [{ produtoId: 1, quantidade: 2, preco: 18 }],
    endereco_entrega: 'Rua dos Ipês, 245', bairro: 'Aponiã', taxa_entrega: 8 },
  { id: 1045, clienteId: 1, data: '2026-11-02T14:30', status: 'concluido', recebimento: 'entrega',
    itens: [{ produtoId: 2, quantidade: 1, preco: 28 }],
    endereco_entrega: 'Rua dos Ipês, 245', bairro: 'Aponiã', taxa_entrega: 8 },
  { id: 1044, clienteId: 1, data: '2026-10-30T11:10', status: 'cancelado', recebimento: 'entrega',
    itens: [{ produtoId: 1, quantidade: 1, preco: 18 }],
    endereco_entrega: 'Rua dos Ipês, 245', bairro: 'Aponiã', taxa_entrega: 8 }
];

function todosPedidos() {
  return lerJSON(CHAVE_PEDIDOS, PEDIDOS_DEMO);
}

/* Subtotal e total são calculados, não guardados duplicados */
function subtotalPedido(pedido) {
  return pedido.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}
function totalPedido(pedido) {
  return subtotalPedido(pedido) + pedido.taxa_entrega;
}

function meusPedidos(clienteId) {
  return todosPedidos()
    .filter(p => p.clienteId === clienteId)
    .sort((a, b) => b.id - a.id);              // mais recente primeiro
}

function buscarPedido(id) {
  return todosPedidos().find(p => p.id === id);
}

/* Cria o pedido a partir do carrinho e esvazia o carrinho */
function criarPedido({ clienteId, recebimento, endereco_entrega, bairro, observacao }) {
  const pedidos = todosPedidos();
  const novo = {
    id: Math.max(0, ...pedidos.map(p => p.id)) + 1,
    clienteId,
    data: new Date().toISOString(),
    status: 'pendente',
    recebimento,
    // Guardamos o preço da hora da compra (como o preco_unitario do banco):
    // se o Pedro mudar o preço amanhã, o pedido antigo não muda.
    itens: itensDetalhados().map(i => ({
      produtoId: i.produtoId, quantidade: i.quantidade, preco: i.produto.preco
    })),
    endereco_entrega: recebimento === 'entrega' ? endereco_entrega : null,
    bairro: recebimento === 'entrega' ? bairro : null,
    taxa_entrega: recebimento === 'entrega' ? LOJA.taxaEntrega : 0,
    observacao: observacao || null
  };
  salvarJSON(CHAVE_PEDIDOS, [...pedidos, novo]);
  esvaziarCarrinho();
  return novo;
}

/* "2 × Carvão vegetal 5 kg · 1 × Carvão vegetal 3 kg" */
function resumoItens(pedido) {
  return pedido.itens.map(item => {
    const produto = buscarProduto(item.produtoId);
    const nome = produto ? `${produto.nome} ${produto.peso} kg` : 'Produto removido';
    return `${item.quantidade} × ${nome}`;
  }).join(' · ');
}

/* "03/11/2026 · 10:42" */
function formatarDataHora(iso) {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} · ${hora}`;
}
