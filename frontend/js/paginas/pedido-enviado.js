/* =========================================================
   PEDIDO-ENVIADO.JS — tela pedido-enviado.html?id=N
   A etapa "03 Confirmação": fecha o fluxo e diz o que
   acontece agora (a pessoa não fica na dúvida).
   ========================================================= */

const cliente = exigirLogin();
montarLayout('pedidos');

const caixa = document.getElementById('confirmacao');
const pedido = buscarPedido(Number(parametroDaURL('id')));

// Só mostra se o pedido existe E é deste cliente
if (!pedido || !cliente || pedido.clienteId !== cliente.id) {
  caixa.innerHTML = `
    <strong>Pedido não encontrado</strong>
    <p class="confirmacao-total">Veja todos os seus pedidos na página Meus pedidos.</p>
    <div class="confirmacao-acoes"><a class="btn" href="meus-pedidos.html">Meus pedidos</a></div>`;
} else {
  const entrega = pedido.recebimento === 'entrega';
  const onde = entrega
    ? `Levamos até <strong>${escaparHTML(pedido.endereco_entrega)}, ${escaparHTML(pedido.bairro)}</strong>.`
    : `Retire na loja: <strong>${LOJA.endereco}</strong>, ${LOJA.horario.toLowerCase()}.`;

  caixa.innerHTML = `
    <span class="confirmacao-icone">${icone('check')}</span>
    <h1>Pedido enviado!</h1>
    <p class="numero-pedido">Número do pedido: <strong>#${pedido.id}</strong></p>
    <p class="confirmacao-total">Total de <strong>${formatarPreco(totalPedido(pedido))}</strong>,
      pago ${entrega ? 'na entrega' : 'na retirada'}.</p>

    <div class="proximos">
      <h2>O que acontece agora</h2>
      <ol>
        <li>A loja confirma o pedido, normalmente em até 30 minutos no horário de funcionamento.</li>
        <li>${onde}</li>
        <li>Acompanhe cada etapa em <strong>Meus pedidos</strong>. Dúvidas: ${LOJA.telefone}.</li>
      </ol>
    </div>

    <div class="confirmacao-acoes">
      <a class="btn" href="meus-pedidos.html">Acompanhar pedido</a>
      <a class="btn btn-contorno" href="index.html">Voltar ao início</a>
    </div>`;
}
