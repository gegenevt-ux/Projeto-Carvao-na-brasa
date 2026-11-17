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

function normalizarPedido(pedido) {
  return {
    ...pedido,
    id: Number(pedido.id),
    clienteId: Number(pedido.cliente_id),
    taxa_entrega: Number(pedido.taxa_entrega),
    total: Number(pedido.total),
    itens: (pedido.itens || []).map(item => ({
      produtoId: Number(item.produto_id),
      quantidade: Number(item.quantidade),
      preco: Number(item.preco_unitario),
      nome: item.nome,
      peso: Number(item.peso)
    }))
  };
}

function subtotalPedido(pedido) {
  return pedido.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
}
function totalPedido(pedido) {
  return Number.isFinite(pedido.total) ? pedido.total : subtotalPedido(pedido) + pedido.taxa_entrega;
}

async function meusPedidos() {
  const pedidos = await requisicaoAPI('/pedidos/meus');
  return pedidos.map(normalizarPedido);
}

async function buscarPedido(id) {
  try {
    return normalizarPedido(await requisicaoAPI(`/pedidos/${id}`));
  } catch (erro) {
    if (erro.status === 404) return null;
    throw erro;
  }
}

async function criarPedido({ recebimento, endereco_entrega, bairro, observacao }) {
  const resposta = await requisicaoAPI('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      recebimento,
      endereco_entrega,
      bairro,
      observacao,
      itens: lerCarrinho().map(item => ({
        produto_id: Number(item.produtoId),
        quantidade: Number(item.quantidade)
      }))
    })
  });
  esvaziarCarrinho();
  return { id: Number(resposta.pedido_id) };
}

/* "2 × Carvão vegetal 5 kg · 1 × Carvão vegetal 3 kg" */
function resumoItens(pedido) {
  return pedido.itens.map(item => {
    const produto = buscarProduto(item.produtoId);
    const nome = produto
      ? `${produto.nome} ${produto.peso} kg`
      : `${item.nome || 'Produto'} ${item.peso ? `${item.peso} kg` : ''}`.trim();
    return `${item.quantidade} × ${nome}`;
  }).join(' · ');
}

/* "03/11/2026 · 10:42" */
function formatarDataHora(iso) {
  const d = new Date(String(iso).replace(' ', 'T') + 'Z');
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} · ${hora}`;
}
