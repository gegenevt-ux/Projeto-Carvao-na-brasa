/* =========================================================
   PRODUTO.JS — tela produto.html?id=N (detalhes)
   ========================================================= */

montarLayout('produtos');

const conteudo = document.getElementById('conteudo-produto');
carregarProdutos()
  .then(() => {
    const produto = buscarProduto(parametroDaURL('id'));
    if (!produto) {
      conteudo.innerHTML = `
        <div class="estado-vazio">
          <strong>Produto não encontrado</strong>
          Ele pode ter saído do catálogo.
          <br><a class="btn" href="catalogo.html">Ver produtos</a>
        </div>`;
    } else {
      desenharProduto(produto);
    }
  })
  .catch(erro => {
    conteudo.innerHTML = `<p class="alerta-erro" role="alert">${escaparHTML(erro.message)}</p>`;
  });

function desenharProduto(produto) {
  const disponivel = produto.disponivel === 1;
  const nomeCompleto = `${produto.nome} ${produto.peso} kg`;
  document.title = `${nomeCompleto} — Carvão do Pedro`;

  conteudo.innerHTML = `
    <nav class="migalhas" aria-label="Você está em">
      <a href="index.html">Início</a> ${icone('direita')}
      <a href="catalogo.html">Produtos</a> ${icone('direita')}
      <span aria-current="page">${nomeCompleto}</span>
    </nav>

    <div class="produto-grade produto ${disponivel ? '' : 'indisponivel'}">
      <div>
        <div class="produto-foto">
          <img src="${produto.imagem}" alt="Pacote de ${nomeCompleto} ao lado de pedaços de carvão">
        </div>
        <p class="legenda-foto">${icone('camera')} Imagem ilustrativa do produto. Peso líquido: ${produto.peso} kg.</p>
      </div>

      <div class="produto-info">
        <div class="produto-info-topo">
          <span class="sobretitulo">${produto.categoria} · Carvão em pacote</span>
          <span class="badge ${disponivel ? 'badge-verde' : 'badge-cinza'}">
            ${disponivel ? 'Disponível' : 'Indisponível'}</span>
        </div>

        <h1>${produto.nome}</h1>
        <p class="produto-pacote">Pacote de ${produto.peso} kg</p>
        <p class="produto-descricao">${produto.descricao}</p>

        <p class="produto-preco">${formatarPreco(produto.preco)}</p>
        <small>por pacote de ${produto.peso} kg</small>

        ${disponivel ? '' : `
          <p class="alerta-info">${icone('info')} Este produto está indisponível no momento e não pode ser adicionado ao carrinho.</p>`}

        <span class="rotulo-pequeno" id="rotulo-qtd">Quantidade</span>
        <div class="comprar">
          <div class="quantidade" role="group" aria-labelledby="rotulo-qtd">
            <button type="button" id="menos" aria-label="Diminuir">${icone('menos')}</button>
            <output id="qtd" aria-live="polite">1</output>
            <button type="button" id="mais" aria-label="Aumentar">${icone('mais')}</button>
          </div>
          <button type="button" class="btn" id="adicionar" ${disponivel ? '' : 'disabled'}>
            ${disponivel ? `${icone('sacola')} Adicionar ao carrinho` : 'Indisponível'}
          </button>
        </div>

        <p class="dica-entrega">${icone('caminhao')}
          Entrega por ${formatarPreco(LOJA.taxaEntrega)}, ou retirada grátis na loja. Pague com Pix pelo site, ou com dinheiro ou cartão na entrega ou na retirada.</p>
          <div class="compartilhar">
          <button type="button" class="btn btn-contorno" id="compartilhar">Compartilhar produto</button>
          <span class="texto-apoio" id="aviso-compartilhar" role="status"></span>
        </div>
      </div>
    </div>

    <p style="margin-top: 32px"><a class="link-laranja" href="catalogo.html">${icone('voltar')} Continuar comprando</a></p>`;

  ativarCompra(produto, disponivel);
  ativarCompartilhar(nomeCompleto);
}
// Compartilha o link deste produto: no celular abre o menu de compartilhar
// (WhatsApp, Instagram...); no computador copia o link.
function ativarCompartilhar(nome) {
  const botao = document.getElementById('compartilhar');
  const aviso = document.getElementById('aviso-compartilhar');
  botao.addEventListener('click', async () => {
    const dados = { title: `${nome} · ${LOJA.nome}`, text: `Olha este carvão do ${LOJA.nome}:`, url: location.href };
    if (navigator.share) {
      try { await navigator.share(dados); } catch { /* a pessoa fechou o menu */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
      aviso.textContent = 'Link copiado. Agora é só colar onde quiser.';
    } catch {
      aviso.textContent = `Copie o link: ${location.href}`;
    }
  });
}

function ativarCompra(produto, disponivel) {
  let quantidade = 1;
  const saida = document.getElementById('qtd');
  const menos = document.getElementById('menos');
  const mais = document.getElementById('mais');

  function atualizar() {
    saida.textContent = quantidade;
    menos.disabled = !disponivel || quantidade <= 1;   // não deixa ir abaixo de 1
    mais.disabled = !disponivel || quantidade >= 99;
  }
  menos.addEventListener('click', () => { quantidade--; atualizar(); });
  mais.addEventListener('click', () => { quantidade++; atualizar(); });
  atualizar();

  document.getElementById('adicionar').addEventListener('click', () => {
    // Visitante: precisa entrar primeiro, e volta para este produto depois
    if (!clienteLogado()) {
      location.href = `login.html?voltar=${encodeURIComponent(`produto.html?id=${produto.id}`)}`;
      return;
    }
    adicionarAoCarrinho(produto.id, quantidade);
    mostrarAviso(`${quantidade} × ${produto.nome} ${produto.peso} kg no carrinho.`,
                 { href: 'carrinho.html', texto: 'Ver carrinho' });
    quantidade = 1;
    atualizar();
  });
}
