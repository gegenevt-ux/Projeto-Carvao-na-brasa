/* =========================================================
   FINALIZAR.JS — tela finalizar.html
   ========================================================= */

const cliente = exigirLogin();

// Sem nada no carrinho não tem o que finalizar
if (cliente && !itensDetalhados().length) location.replace('carrinho.html');

montarLayout('produtos');
aplicarIcones();
ativarMascaras();

const form = document.getElementById('form-pedido');
ativarValidacaoAoVivo(form);

/* Preenche com os dados da conta (a pessoa pode alterar) */
if (cliente) {
  form.nome.value = cliente.nome;
  form.whatsapp.value = cliente.whatsapp;
}
document.getElementById('texto-taxa').textContent = `${formatarPreco(LOJA.taxaEntrega)} · Porto Velho`;

/* Itens do resumo (não mudam nesta tela) */
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

/* Tudo que muda quando troca Entrega <-> Retirada */
function atualizarRecebimento() {
  const entrega = form.recebimento.value === 'entrega';
  const taxa = entrega ? LOJA.taxaEntrega : 0;

  // Endereço só aparece (e só é obrigatório) na entrega
  document.getElementById('bloco-endereco').hidden = !entrega;

  document.getElementById('info-recebimento').innerHTML = entrega
    ? `<strong>Entrega em Porto Velho</strong>
       Levamos até você por ${formatarPreco(LOJA.taxaEntrega)}. Preencha o endereço abaixo.`
    : `<strong>Retirada no ${LOJA.nome}</strong>
       ${LOJA.endereco}<br>${LOJA.horario}`;

  const linhaTaxa = document.getElementById('linha-taxa');
  linhaTaxa.classList.toggle('gratis', !entrega);
  document.getElementById('rotulo-taxa').textContent = entrega ? 'Taxa de entrega' : 'Retirada grátis';
  document.getElementById('valor-taxa').textContent = formatarPreco(taxa);
  document.getElementById('valor-total').textContent = formatarPreco(subtotalCarrinho() + taxa);
}

form.querySelectorAll('[name="recebimento"]').forEach(radio =>
  radio.addEventListener('change', atualizarRecebimento));
atualizarRecebimento();

/* Confirmar */
form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!validarFormulario(form)) return;

  const entrega = form.recebimento.value === 'entrega';
  const complemento = form.complemento.value.trim();

  const pedido = criarPedido({
    clienteId: cliente.id,
    recebimento: form.recebimento.value,
    endereco_entrega: entrega
      ? `${form.rua.value.trim()}, ${form.numero.value.trim()}${complemento ? ` · ${complemento}` : ''}`
      : null,
    bairro: entrega ? form.bairro.value.trim() : null,
    observacao: form.observacao.value.trim()
  });

  // replace: o botão "voltar" do navegador não volta para o formulário já enviado
  location.replace(`pedido-enviado.html?id=${pedido.id}`);
});
