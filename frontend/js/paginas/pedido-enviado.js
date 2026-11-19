/* =========================================================
   PEDIDO-ENVIADO.JS — tela pedido-enviado.html?id=N
   A etapa "03 Confirmação": fecha o fluxo e diz o que
   acontece agora (a pessoa não fica na dúvida).
   ========================================================= */

const cliente = exigirLogin();
montarLayout('pedidos');

const caixa = document.getElementById('confirmacao');
function mostrar() {
   return buscarPedido(Number(parametroDaURL('id')))
  .then(pedido => {
    if (!pedido || !cliente || pedido.clienteId !== cliente.id) {
      caixa.innerHTML = `
        <strong>Pedido não encontrado</strong>
        <p class="confirmacao-total">Veja todos os seus pedidos na página Meus pedidos.</p>
        <div class="confirmacao-acoes"><a class="btn" href="meus-pedidos.html">Meus pedidos</a></div>`;
      return;
    }

    const entrega = pedido.recebimento === 'entrega';
    const linha = (rotulo, valor, classe = '') =>
      `<div class="recibo-linha ${classe}"><span>${rotulo}</span><span>${valor}</span></div>`;

    // Cada produto do pedido numa linha, como num comprovante
    const itens = pedido.itens.map(item => {
      const produto = buscarProduto(item.produtoId);
      const nome = produto ? `${produto.nome} ${produto.peso} kg` : `${item.nome || 'Produto'} ${item.peso} kg`;
      return linha(`${item.quantidade} × ${escaparHTML(nome)}`, formatarPreco(item.preco * item.quantidade));
    }).join('');

    caixa.innerHTML = `
      <p class="recibo-numero">Pedido #${pedido.id}${pedido.data ? ` · ${formatarDataHora(pedido.data)}` : ''}</p>
      <h1>Pedido recebido</h1>
      <p class="recibo-aviso">A loja ainda vai confirmar. Quando ela começar a preparar, o status muda em <a href="meus-pedidos.html">Meus pedidos</a>.</p>

      ${caixaPix(pedido)}
      ${caixaCodigo(pedido)}

      <div class="recibo">
        ${itens}
        ${entrega ? linha('Taxa de entrega', formatarPreco(pedido.taxa_entrega)) : ''}
        ${linha('Total', formatarPreco(totalPedido(pedido)), 'recibo-total')}
      </div>

      <dl class="recibo-dados">
        <div><dt>${entrega ? 'Entrega' : 'Retirada'}</dt>
          <dd>${entrega
            ? `${escaparHTML(pedido.endereco_entrega)} · ${escaparHTML(pedido.bairro)}`
            : `${campoLoja('endereco')}<br>${campoLoja('horario')}`}</dd></div>
        <div><dt>Pagamento</dt><dd>${textoPagamento(pedido)}</dd></div>
        <div><dt>Dúvidas</dt><dd>WhatsApp da loja: ${campoLoja('telefone')}</dd></div>
      </dl>

      <div class="confirmacao-acoes">
        <a class="btn" href="meus-pedidos.html">Acompanhar pedido</a>
        <a class="btn btn-contorno" href="comprovante.html?id=${pedido.id}">Ver comprovante</a>
      </div>`;
  })
  .catch(erro => {
    caixa.innerHTML = `<p class="alerta-erro" role="alert">${escaparHTML(erro.message)}</p>`;
  });
}
mostrar();
// Depois do "Já paguei", desenha de novo (o pagamento aparece como pago)
ligarBotoesPix(caixa, () => mostrar().then(() => caixa.querySelector('h1')?.focus()));
    
