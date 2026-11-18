async function iniciarFinalizacao() {
  const cliente = exigirLogin();
  if (!cliente) return;

  await carregarProdutos();
  if (!itensDetalhados().length) {
    location.replace('carrinho.html');
    return;
  }

  montarLayout('produtos');
  aplicarIcones();
  ativarMascaras();

  const form = document.getElementById('form-pedido');
  const botaoConfirmar = document.querySelector('[form="form-pedido"]');
  ativarValidacaoAoVivo(form);

  form.nome.value = cliente.nome;
  form.whatsapp.value = cliente.whatsapp || '';
  document.getElementById('texto-taxa').textContent = `${formatarPreco(LOJA.taxaEntrega)} · Porto Velho`;

  const itens = itensDetalhados();
  const unidades = totalDeUnidades();
  document.getElementById('resumo-itens').innerHTML = itens.map(({ produto, quantidade, total }) => `
    <li class="resumo-item">
      <img src="${produto.imagem}" alt="">
      <span>${quantidade} × ${produto.nome}
        <small>${produto.peso} kg · ${formatarPreco(produto.preco)} un.</small></span>
      <strong>${formatarPreco(total)}</strong>
    </li>`).join('');
  document.getElementById('rotulo-subtotal').textContent = `Subtotal · ${unidades === 1 ? '1 item' : unidades + ' itens'}`;
  document.getElementById('valor-subtotal').textContent = formatarPreco(subtotalCarrinho());

  function atualizarRecebimento() {
    const entrega = form.recebimento.value === 'entrega';
    const taxa = entrega ? LOJA.taxaEntrega : 0;
    document.getElementById('bloco-endereco').hidden = !entrega;
    document.getElementById('info-recebimento').innerHTML = entrega
      ? `<strong>Entrega em Porto Velho</strong>
         Levamos até você por ${formatarPreco(LOJA.taxaEntrega)}. Preencha o endereço abaixo.`
     : `<strong>Retirada no ${campoLoja('nome')}</strong>
         ${campoLoja('endereco')}<br>${campoLoja('horario')}`;

    const linhaTaxa = document.getElementById('linha-taxa');
    linhaTaxa.classList.toggle('gratis', !entrega);
    document.getElementById('rotulo-taxa').textContent = entrega ? 'Taxa de entrega' : 'Retirada grátis';
    document.getElementById('valor-taxa').textContent = formatarPreco(taxa);
    document.getElementById('valor-total').textContent = formatarPreco(subtotalCarrinho() + taxa);
    atualizarPagamento();
  }

  // Forma de pagamento: o campo de troco só aparece no dinheiro,
  // e o aviso do resumo diz como e quando a pessoa vai pagar
  const NOMES_PAGAMENTO = { pix: 'Pix', dinheiro: 'dinheiro', cartao: 'cartão' };
  function atualizarPagamento() {
    const forma = form.pagamento.value;
    const entrega = form.recebimento.value === 'entrega';
    document.getElementById('bloco-troco').hidden = forma !== 'dinheiro';
    document.getElementById('quando-paga').textContent = forma === 'pix'
      ? 'Com Pix, você paga aqui no site logo depois de confirmar o pedido.'
      : entrega ? 'O pagamento é feito quando o carvão chegar.' : 'O pagamento é feito quando você buscar o carvão na loja.';
    document.getElementById('texto-pagamento').textContent = forma === 'pix'
      ? 'Pagamento com Pix aqui no site, logo depois de confirmar.'
      : `Pagamento com ${NOMES_PAGAMENTO[forma]} ${entrega ? 'quando o carvão chegar' : 'na retirada, na loja'}.`;
  }
  form.querySelectorAll('[name="pagamento"]').forEach(radio =>
    radio.addEventListener('change', atualizarPagamento));

  form.querySelectorAll('[name="recebimento"]').forEach(radio =>
    radio.addEventListener('change', atualizarRecebimento));
  atualizarRecebimento();

  // "100", "100,00" ou "R$ 100" viram 100
  const lerValor = texto => Number(String(texto).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));

  form.addEventListener('submit', async evento => {
    evento.preventDefault();
    const erroExistente = document.getElementById('erro-api');
    if (erroExistente) erroExistente.remove();
    if (!validarFormulario(form)) return;

    // Troco: opcional, mas se vier precisa cobrir o total
    const erroTroco = document.getElementById('erro-troco');
    erroTroco.textContent = ''; form.troco.removeAttribute('aria-invalid');
    let troco = null;
    if (form.pagamento.value === 'dinheiro' && form.troco.value.trim()) {
      troco = lerValor(form.troco.value);
      const totalAtual = subtotalCarrinho() + (form.recebimento.value === 'entrega' ? LOJA.taxaEntrega : 0);
      if (!(troco >= totalAtual)) {
        erroTroco.textContent = `O troco precisa ser para ${formatarPreco(totalAtual)} ou mais.`;
        form.troco.setAttribute('aria-invalid', 'true'); form.troco.focus();
        return;
      }
    }

    const entrega = form.recebimento.value === 'entrega';
    const complemento = form.complemento.value.trim();
    botaoConfirmar.disabled = true;
    try {
      const pedido = await criarPedido({
        recebimento: form.recebimento.value,
        endereco_entrega: entrega
          ? `${form.rua.value.trim()}, ${form.numero.value.trim()}${complemento ? ` · ${complemento}` : ''}`
          : null,
        bairro: entrega ? form.bairro.value.trim() : null,
        observacao: form.observacao.value.trim(),
        forma_pagamento: form.pagamento.value,
        troco_para: troco
      });
      location.replace(`pedido-enviado.html?id=${pedido.id}`);
    } catch (erro) {
      const aviso = document.createElement('p');
      aviso.className = 'alerta-erro';
      aviso.id = 'erro-api';
      aviso.setAttribute('role', 'alert');
      aviso.textContent = erro.message;
      form.appendChild(aviso);
      botaoConfirmar.disabled = false;
    }
  });
}

iniciarFinalizacao().catch(erro => {
  const formulario = document.getElementById('form-pedido');
  const aviso = document.createElement('p');
  aviso.className = 'alerta-erro';
  aviso.setAttribute('role', 'alert');
  aviso.textContent = erro.message;
  formulario.appendChild(aviso);
});
