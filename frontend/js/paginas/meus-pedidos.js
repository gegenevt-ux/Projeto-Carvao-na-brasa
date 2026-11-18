/* =========================================================
   MEUS-PEDIDOS.JS — tela meus-pedidos.html
   ========================================================= */

const cliente = exigirLogin();
montarLayout('pedidos');

const pedidos = [];

/* Cada filtro é um nome + uma regra (função que diz sim/não) */
const FILTROS = [
  { nome: 'Todos',         regra: () => true },
  { nome: 'Em andamento',  regra: p => ['pendente', 'preparando', 'pronto'].includes(p.status) },
  { nome: 'Concluídos',    regra: p => p.status === 'concluido' },
  { nome: 'Cancelados',    regra: p => p.status === 'cancelado' }
];
let filtroAtual = 'Todos';
let historicoAberto = false;   // a gaveta do histórico começa fechada

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
    const texto = Number(pedido.pago) ? 'Pedido cancelado. O valor pago no Pix será devolvido.' : STATUS.cancelado.mensagem;
    return `<p class="pedido-mensagem cancelado">${icone('xCirculo')} ${texto}</p>`;
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
       <p class="suave">${campoLoja('endereco')}</p>`;

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
      ${precisaPagarPix(pedido) ? `<p class="aviso-pix-pendente">Pix ainda não pago. <a href="pedido-enviado.html?id=${pedido.id}">Pagar agora</a></p>` : ''}
      ${caixaCodigo(pedido)}
      <a class="link-laranja link-comprovante" href="comprovante.html?id=${pedido.id}">Ver comprovante</a>
      ${pedido.status === 'pendente'
        ? `<button type="button" class="btn" data-cancelar="${pedido.id}">Cancelar pedido</button>`
        : ''}
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
  } else if (filtroAtual === 'Todos') {   //Em "Todos": pedidos em andamento em cima, e concluídos/cancelados  guardados numa gaveta "Histórico", que a pessoa abre se quiser
    const ativos = visiveis.filter(FILTROS[1].regra);
    const antigos = visiveis.filter(p => !FILTROS[1].regra(p));
    const aberto = historicoAberto || !ativos.length;
    lista.innerHTML = `
      ${ativos.length ? ativos.map(cardPedido).join('') : '<p class="suave">Nenhum pedido em andamento.</p>'}
      ${antigos.length ? `
        <details class="historico" ${aberto ? 'open' : ''}>
          <summary>Histórico <span class="suave">· ${antigos.length === 1 ? '1 pedido concluído ou cancelado' : `${antigos.length} pedidos concluídos ou cancelados`}</span></summary>
          <div class="lista-pedidos">${antigos.map(cardPedido).join('')}</div>
        </details>` : ''}`;
    lista.querySelector('.historico')?.addEventListener('toggle', e => { historicoAberto = e.target.open; });
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

// Botão "Cancelar pedido" (só aparece enquanto o pedido está pendente)
document.getElementById('lista-pedidos').addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-cancelar]');
  if (!botao) return;
  
   const pedidoAlvo = pedidos.find(p => p.id === Number(botao.dataset.cancelar));
  const confirmou = await confirmar({
    titulo: `Cancelar pedido #${pedidoAlvo.id}`,
    texto: 'O pedido não será preparado pela loja e não poderá ser reaberto.',
    linhas: [
      ...pedidoAlvo.itens.map(item => {
        const produto = buscarProduto(item.produtoId);
        const nome = produto ? `${produto.nome} ${produto.peso} kg` : (item.nome || 'Produto');
        return [`${item.quantidade} × ${nome}`, formatarPreco(item.preco * item.quantidade)];
      }),
      ...(pedidoAlvo.taxa_entrega ? [['Taxa de entrega', formatarPreco(pedidoAlvo.taxa_entrega)]] : [])
    ],
    total: formatarPreco(totalPedido(pedidoAlvo)),
    botaoConfirmar: 'Cancelar pedido',
    perigo: true
  });
  if (!confirmou) return;

  botao.disabled = true;
  try {
    await requisicaoAPI(`/pedidos/${botao.dataset.cancelar}/cancelar`, { method: 'PATCH' });
    const pedido = pedidos.find(p => p.id === Number(botao.dataset.cancelar));
    if (pedido) pedido.status = 'cancelado';
    desenhar();
  } catch (erro) {
    alert(erro.message);
    botao.disabled = false;
  }
});

// Busca os pedidos na API uma vez, quando a página abre
Promise.all([carregarProdutos(), cliente ? meusPedidos() : Promise.resolve([])])
  .then(([, pedidosDaAPI]) => {
    pedidos.push(...pedidosDaAPI);
    desenhar();
  })
  .catch(erro => {
    document.getElementById('lista-pedidos').innerHTML =
      `<p class="alerta-erro" role="alert">${escaparHTML(erro.message)}</p>`;
  });
