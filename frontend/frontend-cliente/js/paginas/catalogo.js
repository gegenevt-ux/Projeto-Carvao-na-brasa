/* =========================================================
   CATALOGO.JS — tela catalogo.html (lista de produtos)
   ---------------------------------------------------------
   Ideia central: guardamos o "estado" da tela (filtro e
   busca) em um objeto. Sempre que ele muda, chamamos
   desenhar(), que refaz a lista do zero a partir dos dados.
   Tela = função(dados + estado).
   ========================================================= */

montarLayout('produtos');
aplicarIcones();

const cliente = clienteLogado();
const modoCard = cliente ? 'adicionar' : 'ver';

document.getElementById('faixa-entrega').innerHTML =
  `${icone('caminhao')} Entrega em Porto Velho por ${formatarPreco(LOJA.taxaEntrega)} ou retirada grátis na loja.`;

const estado = { categoria: 'Todos', busca: '' };

/* Os botões de filtro saem das categorias que existem nos dados.
   Se o Pedro cadastrar uma categoria nova, o botão aparece sozinho. */
const categorias = ['Todos', ...new Set(PRODUTOS.map(p => p.categoria))];
const filtros = document.getElementById('filtros');
filtros.innerHTML = categorias.map(c =>
  `<button type="button" class="chip" data-categoria="${c}">${c}</button>`).join('');

/* Remove acentos e maiúsculas: "carvão" encontra "Carvao" */
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function produtosFiltrados() {
  const termo = normalizar(estado.busca.trim());
  return PRODUTOS.filter(p => {
    const naCategoria = estado.categoria === 'Todos' || p.categoria === estado.categoria;
    const textoDoProduto = normalizar(`${p.nome} ${p.categoria} ${p.peso} kg ${p.descricao}`);
    return naCategoria && textoDoProduto.includes(termo);
  });
}

const lista = document.getElementById('lista-produtos');
const contagem = document.getElementById('contagem');

function desenhar() {
  const produtos = produtosFiltrados();

  // aria-pressed diz ao leitor de tela (e ao CSS) qual filtro está ativo
  filtros.querySelectorAll('.chip').forEach(chip =>
    chip.setAttribute('aria-pressed', chip.dataset.categoria === estado.categoria));

  contagem.textContent = produtos.length === 1
    ? '1 produto no catálogo'
    : `${produtos.length} produtos no catálogo`;

  lista.innerHTML = produtos.length
    ? produtos.map(p => criarCardProduto(p, modoCard)).join('')
    : `<div class="estado-vazio" style="grid-column: 1 / -1">
         <strong>Nenhum carvão encontrado</strong>
         Tente outra palavra ou veja todas as categorias.
         <br><button type="button" class="btn btn-contorno" id="limpar">Limpar busca</button>
       </div>`;
}

/* Eventos: mudam o estado e redesenham */
filtros.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  estado.categoria = chip.dataset.categoria;
  desenhar();
});

const campoBusca = document.getElementById('busca');
campoBusca.addEventListener('input', () => {
  estado.busca = campoBusca.value;
  desenhar();
});

lista.addEventListener('click', (e) => {
  if (e.target.id === 'limpar') {
    estado.busca = '';
    estado.categoria = 'Todos';
    campoBusca.value = '';
    desenhar();
    campoBusca.focus();
  }
});

ativarBotoesAdicionar(lista);
desenhar();
