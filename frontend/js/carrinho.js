/* =========================================================
   CARRINHO.JS — a "memória" do carrinho
   ---------------------------------------------------------
   Por que um arquivo só para isso?
   O carrinho é usado em VÁRIAS telas: o catálogo e o produto
   adicionam itens, o cabeçalho mostra a bolinha com a
   quantidade, o carrinho altera e remove, e o finalizar lê o
   total. Se cada tela fizesse do seu jeito, ia dar
   divergência. Aqui fica a regra uma vez só.

   O carrinho é salvo no localStorage como uma lista simples:
       [ { produtoId: 2, quantidade: 2 }, ... ]
   Guardamos só o id: preço e nome vêm sempre do PRODUTOS
   (assim, se o preço mudar, o carrinho já mostra o novo).
   ========================================================= */

const CHAVE_CARRINHO = 'carvao_carrinho';

function lerCarrinho() {
  return lerJSON(CHAVE_CARRINHO, []);
}

function salvarCarrinho(itens) {
  salvarJSON(CHAVE_CARRINHO, itens);
  atualizarBolinhaCarrinho();   // avisa o cabeçalho (layout.js)
}

function adicionarAoCarrinho(produtoId, quantidade = 1) {
  const produto = buscarProduto(produtoId);
  if (!produto || produto.disponivel !== 1) return false; // regra: indisponível não entra

  const itens = lerCarrinho();
  const existente = itens.find(item => item.produtoId === produtoId);
  if (existente) {
    existente.quantidade += quantidade;     // já tinha: soma
  } else {
    itens.push({ produtoId, quantidade });  // não tinha: adiciona
  }
  salvarCarrinho(itens);
  return true;
}

function alterarQuantidade(produtoId, novaQuantidade) {
  const itens = lerCarrinho();
  const item = itens.find(i => i.produtoId === produtoId);
  if (!item) return;
  item.quantidade = Math.max(1, Math.min(99, novaQuantidade)); // entre 1 e 99
  salvarCarrinho(itens);
}

function removerDoCarrinho(produtoId) {
  salvarCarrinho(lerCarrinho().filter(i => i.produtoId !== produtoId));
}

function esvaziarCarrinho() {
  salvarCarrinho([]);
}

/* Junta cada item com os dados do produto e calcula o total da linha.
   É o formato que as telas de carrinho e finalizar usam. */
function itensDetalhados() {
  return lerCarrinho()
    .map(item => {
      const produto = buscarProduto(item.produtoId);
      if (!produto) return null;                 // produto saiu do catálogo
      return { ...item, produto, total: produto.preco * item.quantidade };
    })
    .filter(Boolean);
}

function totalDeUnidades() {
  return lerCarrinho().reduce((soma, item) => soma + item.quantidade, 0);
}

function subtotalCarrinho() {
  return itensDetalhados().reduce((soma, item) => soma + item.total, 0);
}
