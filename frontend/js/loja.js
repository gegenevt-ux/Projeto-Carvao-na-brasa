/* =========================================================
   LOJA.JS — ferramentas usadas por todas as telas
   (formatar preço, ler a URL, salvar no navegador,
   montar o card de produto, mostrar avisos)
   ========================================================= */

/* 18 -> "R$ 18,00" */
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* Lê um parâmetro da URL. Em produto.html?id=2 -> parametroDaURL('id') = "2" */
function parametroDaURL(nome) {
  return new URLSearchParams(location.search).get(nome);
}

function buscarProduto(id) {
  return PRODUTOS.find(p => p.id === Number(id));
}

/* Evita que texto digitado pelo usuário vire HTML
   (ex.: alguém colocar <script> no nome do cadastro) */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

/* --- localStorage com proteção ---
   Em aba anônima ou com dados corrompidos, o localStorage
   pode falhar. O try/catch evita que a página quebre. */
function lerJSON(chave, padrao) {
  try {
    const texto = localStorage.getItem(chave);
    return texto ? JSON.parse(texto) : padrao;
  } catch (erro) {
    return padrao;
  }
}
function salvarJSON(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) { /* bloqueado ou sem espaço: segue sem salvar */ }
}

/* --- Card de produto (Início e Catálogo) ---
   modo 'ver'       -> botão "Ver produto" (visitante, na Home)
   modo 'adicionar' -> botão "Adicionar ao carrinho" (logado) */
function criarCardProduto(produto, modo = 'ver') {
  const disponivel = produto.disponivel === 1;
  const link = `produto.html?id=${produto.id}`;

  let botao;
  if (!disponivel) {
    botao = `<button class="btn btn-bloco" disabled>Indisponível</button>`;
  } else if (modo === 'adicionar') {
    botao = `<button class="btn btn-bloco" data-adicionar="${produto.id}">
               ${icone('mais')} Adicionar ao carrinho</button>`;
  } else {
    botao = `<a class="btn btn-bloco" href="${link}">${icone('mais')} Ver produto</a>`;
  }

  return `
    <article class="card-produto ${disponivel ? '' : 'indisponivel'}">
      <a class="card-produto-foto" href="${link}" tabindex="-1" aria-hidden="true">
        <img src="${produto.imagem}" alt="" loading="lazy">
        <span class="etiqueta-peso">${produto.peso} kg</span>
      </a>
      <div class="card-produto-info">
        <div class="card-produto-topo">
          <span class="card-produto-categoria">${produto.categoria}</span>
          <span class="badge ${disponivel ? 'badge-verde' : 'badge-cinza'}">
            ${disponivel ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
        <h3><a href="${link}">${produto.nome}</a></h3>
        <p class="card-produto-preco">
          <strong>${formatarPreco(produto.preco)}</strong>
          <span>/ pacote de ${produto.peso} kg</span>
        </p>
        ${botao}
      </div>
    </article>`;
}

/* --- Clique em "Adicionar ao carrinho" dentro de uma grade de cards ---
   Em vez de colocar um evento em CADA botão, colocamos UM na grade
   e descobrimos qual botão foi clicado (delegação de eventos).
   Vantagem: funciona mesmo para cards criados depois (filtros). */
function ativarBotoesAdicionar(grade) {
  grade.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-adicionar]');
    if (!botao) return;
    const produto = buscarProduto(botao.dataset.adicionar);
    if (adicionarAoCarrinho(produto.id, 1)) {
      mostrarAviso(`${produto.nome} ${produto.peso} kg adicionado ao carrinho.`,
                   { href: 'carrinho.html', texto: 'Ver carrinho' });
    }
  });
}

/* --- Aviso flutuante (toast) ---
   Feedback rápido depois de uma ação: "Adicionado ao carrinho". */
function mostrarAviso(mensagem, link) {
  let aviso = document.getElementById('aviso');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'aviso';
    aviso.className = 'aviso';
    aviso.setAttribute('role', 'status');   // leitor de tela anuncia
    document.body.appendChild(aviso);
  }
  aviso.innerHTML = `${icone('check')} <span>${mensagem}</span>
    ${link ? `<a href="${link.href}">${link.texto}</a>` : ''}`;
  aviso.classList.add('visivel');

  clearTimeout(aviso.timer);
  aviso.timer = setTimeout(() => aviso.classList.remove('visivel'), 3500);
}
