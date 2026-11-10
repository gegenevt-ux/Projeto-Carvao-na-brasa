/* =========================================================
   LAYOUT.JS — cabeçalho e rodapé de todas as telas
   ---------------------------------------------------------
   Por que gerar o cabeçalho com JavaScript em vez de
   escrever no HTML de cada página?
   1. Ele é igual em 7 telas. Copiar e colar 7 vezes = 7
      lugares para corrigir quando algo mudar.
   2. Ele MUDA conforme o login: visitante vê "Entrar";
      logado vê o nome e o carrinho com a bolinha.
   Cada página só tem <div id="cabecalho"></div> e chama
   montarLayout('produtos') dizendo qual menu fica ativo.
   ========================================================= */

const LOGO = `
  <a class="logo" href="index.html" aria-label="Carvão do Pedro — início">
    <span class="logo-icone">${icone('chama')}</span>
    <span class="logo-texto">Carvão do<br>Pedro</span>
  </a>`;

function montarCabecalho(paginaAtiva) {
  const cliente = clienteLogado();
  const links = [
    { id: 'inicio',  texto: 'Início',       href: 'index.html' },
    { id: 'produtos', texto: 'Produtos',    href: 'catalogo.html' },
    { id: 'pedidos', texto: 'Meus pedidos', href: 'meus-pedidos.html' }
  ];

  const menu = links.map(l => `
    <a href="${l.href}" ${l.id === paginaAtiva ? 'aria-current="page"' : ''}>${l.texto}</a>`
  ).join('');

  // Lado direito: visitante x logado
  const acoes = cliente
    ? `<details class="menu-usuario">
         <summary>${icone('usuario')}<span class="menu-usuario-nome">${escaparHTML(cliente.nome)}</span>${icone('baixo', 'icone icone-seta')}</summary>
         <div class="menu-usuario-lista">
           <a href="meus-pedidos.html">Meus pedidos</a>
           <button type="button" data-sair>${icone('sair')} Sair</button>
         </div>
       </details>
       <a class="botao-carrinho" href="carrinho.html" aria-label="Carrinho">
         ${icone('sacola', 'icone icone-grande')}
         <span class="bolinha" id="bolinha-carrinho"></span>
       </a>`
    : `<a class="btn" href="login.html">${icone('entrar')} Entrar</a>`;

  return `
    <header class="cabecalho">
      <div class="container cabecalho-conteudo">
        ${LOGO}
        <nav class="menu" aria-label="Menu principal">${menu}</nav>
        <div class="cabecalho-acoes">${acoes}</div>
      </div>
    </header>`;
}

/* Cabeçalho das telas de login e cadastro: sem menu,
   para a pessoa focar só no formulário. */
function montarCabecalhoSimples() {
  return `
    <header class="cabecalho">
      <div class="container cabecalho-conteudo">
        ${LOGO}
        <a class="link-voltar" href="index.html">${icone('voltar')} Voltar para a loja</a>
      </div>
    </header>`;
}

function montarRodape(completo = false) {
  const topo = completo
    ? `<div class="rodape-marca">${LOGO}</div>`
    : `<strong class="rodape-nome">CARVÃO DO PEDRO</strong>`;
  const fim = completo
    ? `<div class="rodape-fim container">
         <span>Carvão do Pedro · Porto Velho, RO</span>
         <span>Feito para reunir em volta da brasa.</span>
       </div>`
    : '';

  return `
    <footer class="rodape">
      <div class="container rodape-conteudo">
        ${topo}
        <address>
          ${LOJA.endereco}<br>
          <span>${LOJA.telefone} · ${LOJA.horario}</span>
        </address>
        <p class="rodape-nota">Endereço, telefone e horário ilustrativos. Dados de exemplo.</p>
      </div>
      ${fim}
    </footer>`;
}

/* Atualiza o número na bolinha do carrinho */
function atualizarBolinhaCarrinho() {
  const bolinha = document.getElementById('bolinha-carrinho');
  if (!bolinha) return;
  const total = totalDeUnidades();
  bolinha.textContent = total;
  bolinha.hidden = total === 0;
}

/* Chamada por cada página. opcoes.simples = login/cadastro */
function montarLayout(paginaAtiva, opcoes = {}) {
  document.getElementById('cabecalho').outerHTML =
    opcoes.simples ? montarCabecalhoSimples() : montarCabecalho(paginaAtiva);
  document.getElementById('rodape').outerHTML = montarRodape(opcoes.rodapeCompleto);

  atualizarBolinhaCarrinho();

  const botaoSair = document.querySelector('[data-sair]');
  if (botaoSair) botaoSair.addEventListener('click', sair);
}
