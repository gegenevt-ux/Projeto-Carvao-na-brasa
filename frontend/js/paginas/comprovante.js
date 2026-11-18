/* =========================================================
   PAGINAS/COMPROVANTE.JS — tela comprovante.html?id=N
   Comprovante do pedido para imprimir ou salvar em PDF.
   Serve para o cliente (só os pedidos dele) e para o Pedro
   (qualquer pedido). NÃO é nota fiscal, e diz isso no rodapé.
   ========================================================= */

const sessao = lerJSON(CHAVE_SESSAO, null);
if (!sessao || !sessao.token) {
  location.replace(`login.html?voltar=${encodeURIComponent('comprovante.html' + location.search)}`);
}
// O botão "Voltar" leva cada um para a sua área
if (sessao && sessao.tipo === 'comerciante') document.getElementById('voltar').href = 'pedidos.html';

document.getElementById('imprimir').addEventListener('click', () => window.print());

const caixa = document.getElementById('comprovante');
const linha = (rotulo, valor, classe = '') =>
  `<div class="cp-linha ${classe}"><span>${rotulo}</span><span>${valor}</span></div>`;

Promise.all([
  buscarPedido(Number(parametroDaURL('id'))),
  requisicaoAPI('/comercio').catch(() => ({})),   // dados da loja; se falhar, usa os do site
  carregarProdutos().catch(() => {})
]).then(([pedido, loja]) => {
  if (!pedido) {
    caixa.innerHTML = '<p>Pedido não encontrado.</p>';
    return;
  }
  const nomeLoja = loja.nome_comercio || LOJA.nome;
  const endereco = loja.endereco || LOJA.endereco;
  const telefone = loja.telefone || LOJA.telefone;
  const horario = loja.horario || LOJA.horario;
  const cancelado = pedido.status === 'cancelado';
  const entrega = pedido.recebimento === 'entrega';
  document.title = `Comprovante do pedido #${pedido.id} — ${nomeLoja}`;

  const itens = pedido.itens.map(item => {
    const produto = buscarProduto(item.produtoId);
    const nome = produto ? `${produto.nome} ${produto.peso} kg` : `${item.nome || 'Produto'} ${item.peso} kg`;
    return linha(`${item.quantidade} × ${escaparHTML(nome)}`, formatarPreco(item.preco * item.quantidade));
  }).join('');

  caixa.innerHTML = `
    <header class="cp-loja">
      <h1>${escaparHTML(nomeLoja)}</h1>
      <p>${escaparHTML(endereco)}</p>
      <p>WhatsApp ${escaparHTML(telefone)}</p>
      ${loja.documento ? `<p>${escaparHTML(loja.razao_social || nomeLoja)} · ${loja.documento.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} ${escaparHTML(loja.documento)}</p>` : ''}
    </header>

    <section class="cp-bloco">
      <h2>Comprovante do pedido #${pedido.id}</h2>
      ${pedido.data ? `<p>${formatarDataHora(pedido.data)}</p>` : ''}
      <p>Cliente: ${escaparHTML(pedido.cliente_nome || '')}${pedido.cliente_whatsapp ? ` · ${escaparHTML(pedido.cliente_whatsapp)}` : ''}</p>
    </section>

    <section class="cp-bloco cp-itens" aria-label="Itens do pedido">
      ${itens}
      ${linha(entrega ? 'Taxa de entrega' : 'Retirada na loja', formatarPreco(pedido.taxa_entrega))}
      ${linha('Total', formatarPreco(totalPedido(pedido)), 'cp-total')}
    </section>

    <section class="cp-bloco">
      ${entrega ? `<p>Entrega: ${escaparHTML(pedido.endereco_entrega)} · ${escaparHTML(pedido.bairro)}</p>` : ''}
      <p>Pagamento: ${textoPagamento(pedido)}</p>
      ${pedido.observacao ? `<p>Obs.: ${escaparHTML(pedido.observacao)}</p>` : ''}
    </section>

    ${cancelado
      ? `<p class="cp-aviso cp-aviso-cancelado">${Number(pedido.pago) ? 'Pedido cancelado. O valor pago no Pix será devolvido.' : 'Pedido cancelado. Não há nada a pagar.'}</p>`
      : (entrega
        ? (temCodigoAtivo(pedido) ? `
    <section class="cp-aviso" aria-label="Código de entrega">
      <h2>Código de entrega: ${pedido.codigo_entrega}</h2>
      <p>Fale este código para o entregador só quando receber o carvão.</p>
    </section>` : '')
        : `
    <section class="cp-aviso" aria-label="Como retirar">
      <h2>Para retirar</h2>
      <p>Mostre este comprovante na loja, no celular ou impresso, e ${temCodigoAtivo(pedido)
        ? `fale o código de retirada <strong>${pedido.codigo_entrega}</strong>`
        : `informe o pedido <strong>#${pedido.id}</strong>`}.</p>
      <p>Horário da loja: ${escaparHTML(horario)}</p>
    </section>`)}

    <footer class="cp-rodape">Este comprovante não é documento fiscal.</footer>`;
}).catch(erro => {
  caixa.innerHTML = `<p class="alerta-erro" role="alert">${escaparHTML(erro.message)}</p>`;
});
