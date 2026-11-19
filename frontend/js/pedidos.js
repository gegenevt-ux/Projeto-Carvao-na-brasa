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
  pendente:   { rotulo: 'Pendente',   badge: 'badge-laranja',  mensagem: 'Pedido enviado. Aguardando confirmação da loja.' },
  preparando: { rotulo: 'Preparando', badge: 'badge-laranja',  mensagem: 'A loja já está separando o seu carvão.' },
  pronto:     { rotulo: 'Pronto',     badge: 'badge-verde',    mensagem: '' },  // depende de entrega/retirada
  concluido:  { rotulo: 'Concluído',  badge: 'badge-verde',    mensagem: 'Pedido concluído. Bom churrasco!' },
  cancelado:  { rotulo: 'Cancelado',  badge: 'badge-vermelho', mensagem: 'Pedido cancelado. Não há nada a pagar.' }
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

async function criarPedido({ recebimento, endereco_entrega, bairro, observacao, forma_pagamento, troco_para }) {
  const resposta = await requisicaoAPI('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      recebimento,
      endereco_entrega,
      bairro,
      observacao,
      forma_pagamento,
      troco_para,
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

/* "Pix, na entrega" · "Dinheiro, na retirada · troco para R$ 100,00" */
function textoPagamento(pedido) {
  const nome = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' }[pedido.forma_pagamento];
  const quando = pedido.recebimento === 'entrega' ? 'na entrega' : 'na retirada';
  if (pedido.forma_pagamento === 'pix') return `Pix pelo site · ${Number(pedido.pago) ? 'pago' : 'aguardando pagamento'}`;
  if (!nome) return `Na ${pedido.recebimento === 'entrega' ? 'entrega' : 'retirada'}`;
  const troco = pedido.forma_pagamento === 'dinheiro'
    ? (pedido.troco_para ? ` · troco para ${formatarPreco(Number(pedido.troco_para))}` : ' · sem troco') : '';
  return `${nome}, ${quando}${troco}`;
}

/* --- Código de entrega ---
   4 números que o cliente fala para o entregador (ou na loja, ao retirar).
   Só aparece enquanto o pedido está em andamento. */
function temCodigoAtivo(pedido) {
  return Boolean(pedido.codigo_entrega) && !['concluido', 'cancelado'].includes(pedido.status);
}
function caixaCodigo(pedido) {
  if (!temCodigoAtivo(pedido)) return '';
  const entrega = pedido.recebimento === 'entrega';
  return `
    <div class="caixa-codigo">
      <span class="caixa-codigo-rotulo">Código de ${entrega ? 'entrega' : 'retirada'}</span>
      <strong class="caixa-codigo-numero" aria-label="${pedido.codigo_entrega.split('').join(' ')}">${pedido.codigo_entrega}</strong>
      <p>${entrega
        ? 'Fale este código para o entregador só quando receber o carvão.'
        : 'Fale este código no balcão da loja na hora de retirar.'}</p>
    </div>`;
}

/* --- Pix pelo site (DEMONSTRAÇÃO) ---
   Não cobra nada de verdade: mostra um QR code de mentira e o botão
   "Já paguei" só marca o pedido como pago. */
function precisaPagarPix(pedido) {
  return pedido.forma_pagamento === 'pix' && !Number(pedido.pago) && pedido.status !== 'cancelado';
}
function qrDeMentira(semente) {
  // Desenha quadradinhos a partir do número do pedido (não é um QR code de verdade)
  let x = Number(semente) * 9301 + 49297, celulas = '';
  for (let i = 0; i < 21 * 21; i++) {
    const lin = Math.floor(i / 21), col = i % 21;
    const canto = (lin < 7 && col < 7) || (lin < 7 && col > 13) || (lin > 13 && col < 7);
    let cheio;
    if (canto) {
      const l = lin % 14 > 6 ? lin - 14 : lin % 14, c = col > 13 ? col - 14 : col;
      cheio = l === 0 || l === 6 || c === 0 || c === 6 || (l >= 2 && l <= 4 && c >= 2 && c <= 4);
    } else { x = (x * 1103515245 + 12345) % 2147483648; cheio = x % 3 === 0; }
    celulas += `<i${cheio ? ' class="cheio"' : ''}></i>`;
  }
  return `<div class="qr-mentira" aria-hidden="true">${celulas}<span>DEMO</span></div>`;
}
function caixaPix(pedido) {
  if (!precisaPagarPix(pedido)) return '';
  const codigo = `DEMONSTRACAO.CARVAODOPEDRO.PEDIDO${pedido.id}.VALOR${totalPedido(pedido).toFixed(2)}`;
  return `
    <section class="caixa-pix" aria-labelledby="titulo-pix-${pedido.id}">
      <h2 id="titulo-pix-${pedido.id}">Pague com Pix: ${formatarPreco(totalPedido(pedido))}</h2>
      <p class="caixa-pix-aviso"><strong>Demonstração:</strong> este Pix é de mentira, nenhum valor é cobrado.</p>
      <div class="caixa-pix-corpo">
        ${qrDeMentira(pedido.id)}
        <div>
          <label for="pix-copia-${pedido.id}">Pix copia e cola</label>
          <input class="input" id="pix-copia-${pedido.id}" value="${codigo}" readonly>
          <div class="caixa-pix-botoes">
            <button type="button" class="btn btn-contorno" data-copiar-pix="pix-copia-${pedido.id}">Copiar código</button>
            <button type="button" class="btn" data-ja-paguei="${pedido.id}">Já paguei (simular)</button>
          </div>
          <p class="erro-campo" role="alert" id="erro-pix-${pedido.id}"></p>
        </div>
      </div>
    </section>`;
}
/* Liga os botões "Copiar código" e "Já paguei" de uma área da página */
function ligarBotoesPix(area, depoisDePagar) {
  area.addEventListener('click', async evento => {
    const copiar = evento.target.closest('[data-copiar-pix]');
    if (copiar) {
      const campo = document.getElementById(copiar.dataset.copiarPix);
      campo.select();
      try { await navigator.clipboard.writeText(campo.value); } catch { document.execCommand('copy'); }
      copiar.textContent = 'Código copiado';
      return;
    }
    const pagar = evento.target.closest('[data-ja-paguei]');
    if (!pagar) return;
    pagar.disabled = true;
    try {
      await requisicaoAPI(`/pedidos/${pagar.dataset.jaPaguei}/pagar`, { method: 'PATCH' });
      depoisDePagar();
    } catch (erro) {
      document.getElementById(`erro-pix-${pagar.dataset.jaPaguei}`).textContent = erro.message;
      pagar.disabled = false;
    }
  });
}
