/* =========================================================
   MEUS-PEDIDOS.JS — tela meus-pedidos.html
   ========================================================= */

const cliente = exigirLogin();
montarLayout('pedidos');

const pedidos = cliente ? meusPedidos(cliente.id) : [];

/* Cada filtro é um nome + uma regra (função que diz sim/não) */
const FILTROS = [
  { nome: 'Todos',         regra: () => true },
  { nome: 'Em andamento',  regra: p => ['pendente', 'preparando', 'pronto'].includes(p.status) },
  { nome: 'Concluídos',    regra: p => p.status === 'concluido' },
  { nome: 'Cancelados',    regra: p => p.status === 'cancelado' }
];
let filtroAtual = 'Todos';

const filtros = document.getElementById('filtros');
filtros.innerHTML = FILTROS.map(f =>
  `<button type="button" class="chip" data-filtro="${f.nome}">${f.nome}</button>`).join('');

/* Linha do tempo: compara a posição do status com cada etapa */
function linhaDoTempo(pedido) {
  const posicaoAtual = ETAPAS.findIndex(e => e.status === pedido.status);
  return `
    <ol class="linha-tempo" aria-label="Andamento do pedido">
      ${ETAPAS.map((etapa, i) => {
        // antes da atual = feito; a atual = atual (o último passo, se chegou, também conta como feito)
        const classe = i < posicaoAtual || (i === posicaoAtual && etapa.status === 'concluido')
          ? 'feito' : i === posicaoAtual ? 'atual' : '';
        return `
          <li class="passo ${classe}" ${i === posicaoAtual ? 'aria-current="step"' : ''}>
            <span class="passo-bolinha">${classe === 'feito' ? icone('check') : ''}</span>
            ${etapa.rotulo}
          </li>`;
      }).join('')}
    </ol>`;
}

function mensagemDoPedido(pedido) {
  if (pedido.status === 'cancelado') {
    return `<p class="pedido-mensagem cancelado">${icone('xCirculo')} ${STATUS.cancelado.mensagem}</p>`;
  }
  let texto = STATUS[pedido.status].mensagem;
  if (pedido.status === 'pronto') {
    texto = pedido.recebimento === 'retirada'
      ? 'Seu pedido está pronto para retirada na loja.'
      : 'Seu pedido está pronto e sai para entrega em breve.';
  }
  const ok = ['pronto', 'concluido'].includes(pedido.status);
  return `<p class="pedido-mensagem ${ok ? 'ok' : ''}">${texto}</p>`;
}

function cardPedido(pedido) {
  const status = STATUS[pedido.status];
  const entrega = pedido.recebimento === 'entrega';
  const local = entrega
    ? `<span class="rotulo-detalhe">${icone('caminhao')} Entrega</span>
       <p class="suave">${escaparHTML(pedido.endereco_entrega)} · ${escaparHTML(pedido.bairro)} · Porto Velho/RO</p>`
    : `<span class="rotulo-detalhe">${icone('loja')} Retirada na loja</span>
       <p class="suave">${LOJA.endereco}</p>`;

  return `
    <article class="painel painel-corpo">
      <div class="pedido-cabeca">
        <h2>Pedido #${pedido.id} <small>${formatarDataHora(pedido.data)}</small></h2>
        <span class="badge ${status.badge}">${status.rotulo}</span>
      </div>

      <div class="pedido-detalhes">
        <div>
          <span class="rotulo-detalhe">Produtos</span>
          <p>${resumoItens(pedido)}</p>
        </div>
        <div>${local}</div>
        <div class="pedido-valores">
          Subtotal ${formatarPreco(subtotalPedido(pedido))}<br>
          Taxa ${formatarPreco(pedido.taxa_entrega)}
          <strong>${formatarPreco(totalPedido(pedido))}</strong>
        </div>
      </div>

      ${pedido.status === 'cancelado' ? '' : linhaDoTempo(pedido)}
      ${mensagemDoPedido(pedido)}
    </article>`;
}

function desenhar() {
  const regra = FILTROS.find(f => f.nome === filtroAtual).regra;
  const visiveis = pedidos.filter(regra);

  filtros.querySelectorAll('.chip').forEach(c =>
    c.setAttribute('aria-pressed', c.dataset.filtro === filtroAtual));
  document.getElementById('contagem').textContent =
    visiveis.length === 1 ? '1 pedido' : `${visiveis.length} pedidos`;

  const lista = document.getElementById('lista-pedidos');
  if (!pedidos.length) {
    lista.innerHTML = `
      <div class="estado-vazio">
        <strong>Você ainda não fez pedidos</strong>
        Escolha seu carvão e acompanhe tudo por aqui.
        <br><a class="btn" href="catalogo.html">Ver produtos</a>
      </div>`;
  } else if (!visiveis.length) {
    lista.innerHTML = `<div class="estado-vazio"><strong>Nenhum pedido aqui</strong>Não há pedidos neste filtro.</div>`;
  } else {
    lista.innerHTML = visiveis.map(cardPedido).join('');
  }
}

filtros.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filtroAtual = chip.dataset.filtro;
  desenhar();
});

desenhar();
