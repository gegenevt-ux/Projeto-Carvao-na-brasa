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
  }

  form.querySelectorAll('[name="recebimento"]').forEach(radio =>
    radio.addEventListener('change', atualizarRecebimento));
  atualizarRecebimento();

  form.addEventListener('submit', async evento => {
    evento.preventDefault();
    const erroExistente = document.getElementById('erro-api');
    if (erroExistente) erroExistente.remove();
    if (!validarFormulario(form)) return;

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
        observacao: form.observacao.value.trim()
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
