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
               ${icone('mais')} Adicionar ao carrinho<span class="so-leitor">: ${produto.nome} ${produto.peso} kg, ${produto.categoria}</span></button>`;
  } else {
    botao = `<a class="btn btn-bloco" href="${link}">${icone('mais')} Ver produto<span class="so-leitor">: ${produto.nome} ${produto.peso} kg, ${produto.categoria}</span></a>`;
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
        <h3><a href="${link}">${produto.nome}<span class="so-leitor"> ${produto.peso} kg, ${produto.categoria}</span></a></h3>
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
/* --- Caixa de confirmação (no lugar do confirm() do navegador) ---
   Serve para qualquer tela. Devolve true se a pessoa confirmou.
   - linhas: lista opcional de [rótulo, valor], como um recibo
   - total:  valor opcional mostrado em negrito no fim
   - perigo: true deixa o botão vermelho (excluir, cancelar) */
function confirmar({ titulo, texto = '', linhas = [], total = null,
                     botaoConfirmar = 'Confirmar', botaoVoltar = 'Voltar', perigo = false }) {
  return new Promise(resolver => {
    const caixa = document.createElement('dialog');
    caixa.className = 'caixa-confirmar';
    caixa.setAttribute('aria-labelledby', 'caixa-confirmar-titulo');
    if (texto) caixa.setAttribute('aria-describedby', 'caixa-confirmar-texto');

    const linha = ([rotulo, valor], extra = '') =>
      `<div class="caixa-confirmar-linha ${extra}"><span>${escaparHTML(String(rotulo))}</span><span>${escaparHTML(String(valor))}</span></div>`;

    caixa.innerHTML = `
      <div class="caixa-confirmar-topo">
        <h2 id="caixa-confirmar-titulo">${escaparHTML(titulo)}</h2>
        <button type="button" class="caixa-confirmar-fechar" value="nao" aria-label="Fechar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      ${texto || linhas.length || total ? `<div class="caixa-confirmar-corpo">
        ${texto ? `<p id="caixa-confirmar-texto">${escaparHTML(texto)}</p>` : ''}
        ${linhas.map(l => linha(l)).join('')}
        ${total ? linha(['Total', total], 'caixa-confirmar-total') : ''}
      </div>` : ''}
      <div class="caixa-confirmar-rodape">
        <button type="button" class="btn btn-contorno" value="nao" autofocus>${escaparHTML(botaoVoltar)}</button>
        <button type="button" class="btn ${perigo ? 'btn-perigo' : ''}" value="sim">${escaparHTML(botaoConfirmar)}</button>
      </div>`;

    const fechar = (resposta) => { caixa.close(); caixa.remove(); resolver(resposta); };
    caixa.addEventListener('click', e => {
      if (e.target === caixa) return fechar(false);           // clique no fundo escuro
      const b = e.target.closest('button'); if (b) fechar(b.value === 'sim');
    });
    caixa.addEventListener('cancel', e => { e.preventDefault(); fechar(false); });   // tecla Esc
    document.body.appendChild(caixa);
    caixa.showModal();
  });
}
