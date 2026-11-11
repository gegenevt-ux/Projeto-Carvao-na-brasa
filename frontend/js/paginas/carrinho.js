/* =========================================================
   PAGINAS/CARRINHO.JS — tela carrinho.html
   (a lógica do carrinho fica em js/carrinho.js;
    aqui é só o desenho da tela)
   ========================================================= */

exigirLogin();
montarLayout('produtos');

const conteudo = document.getElementById('conteudo-carrinho');
const subtitulo = document.getElementById('subtitulo');

function textoItens(n) { return n === 1 ? '1 item' : `${n} itens`; }

function desenhar() {
  const itens = itensDetalhados();
  const unidades = totalDeUnidades();

  /* Carrinho vazio: em vez de uma tela em branco, um caminho de volta */
  if (!itens.length) {
    subtitulo.textContent = 'Seu carrinho está vazio.';
    conteudo.innerHTML = `
      <div class="estado-vazio" style="margin-top: 28px">
        <strong>Nenhum carvão por aqui ainda</strong>
        Escolha um pacote e ele aparece nesta lista.
        <br><a class="btn" href="catalogo.html">${icone('seta')} Ver produtos</a>
      </div>`;
    return;
  }

  subtitulo.textContent = `${textoItens(unidades)} ${unidades === 1 ? 'escolhido' : 'escolhidos'}. Confira as quantidades antes de continuar.`;

  const linhas = itens.map(({ produto, quantidade, total }) => `
    <li class="item-carrinho">
      <img src="${produto.imagem}" alt="">
      <div>
        <h3>${produto.nome}</h3>
        <p>Pacote de ${produto.peso} kg · ${produto.categoria}</p>
        <p>${formatarPreco(produto.preco)} / unidade</p>
        <button type="button" class="remover" data-remover="${produto.id}">
          ${icone('lixeira')} Remover</button>
      </div>
      <div class="item-carrinho-lado">
        <div class="quantidade" role="group" aria-label="Quantidade de ${produto.nome} ${produto.peso} kg">
          <button type="button" data-menos="${produto.id}" aria-label="Diminuir" ${quantidade <= 1 ? 'disabled' : ''}>${icone('menos')}</button>
          <output>${quantidade}</output>
          <button type="button" data-mais="${produto.id}" aria-label="Aumentar">${icone('mais')}</button>
        </div>
        <span class="item-carrinho-total">${formatarPreco(total)}</span>
      </div>
    </li>`).join('');

  conteudo.innerHTML = `
    <div class="duas-colunas">
      <section class="painel" aria-label="Produtos no carrinho">
        <div class="lista-carrinho-topo"><span>Produto</span><span>Quantidade / total</span></div>
        <ul>${linhas}</ul>
        <div class="lista-carrinho-fim">
          <a class="link-laranja" href="catalogo.html">${icone('voltar')} Continuar comprando</a>
        </div>
      </section>

      <aside class="painel painel-corpo resumo">
        <h2>Resumo do pedido</h2>
        <p class="linha-valor"><span>Subtotal · ${textoItens(unidades)}</span><strong>${formatarPreco(subtotalCarrinho())}</strong></p>
        <p class="resumo-obs">Entrega ou retirada será escolhida na próxima etapa.</p>
        <p class="resumo-total"><span>Total</span><strong>${formatarPreco(subtotalCarrinho())}</strong></p>
        <a class="btn btn-bloco" href="finalizar.html">${icone('seta')} Finalizar pedido</a>
      </aside>
    </div>
    <p class="nota">${icone('carteira')} Sem pagamento online. Você paga ao receber ou retirar o pedido.</p>`;
}

/* Um único "ouvinte" para todos os botões (delegação).
   Depois de cada mudança, redesenha tudo: totais sempre certos. */
conteudo.addEventListener('click', (e) => {
  const botao = e.target.closest('button');
  if (!botao) return;
  const { mais, menos, remover } = botao.dataset;
  const item = (id) => lerCarrinho().find(i => i.produtoId === Number(id));

  if (mais) alterarQuantidade(Number(mais), item(mais).quantidade + 1);
  if (menos) alterarQuantidade(Number(menos), item(menos).quantidade - 1);
  if (remover) {
    const produto = buscarProduto(remover);
    removerDoCarrinho(Number(remover));
    mostrarAviso(`${produto.nome} ${produto.peso} kg removido do carrinho.`);
  }
  desenhar();
});

desenhar();
