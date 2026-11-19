let PRODUTOS = [];

// Troca os sinais que viram código no HTML (< > & " ') por versões seguras.
// Assim, se alguém cadastrar um produto com código no nome, ele aparece como texto.
function protegido(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, sinal =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[sinal]);
}

async function carregarProdutos() {
  const produtos = await requisicaoAPI('/produtos');
  if (!Array.isArray(produtos)) {
    throw new Error('A API retornou uma lista de produtos inválida.');
  }

  const imagensLocais = {
    'tradicional-3': 'assets/img/produto-tradicional-3kg.jpg',
    'tradicional-5': 'assets/img/produto-tradicional-5kg.jpg',
    'misto-5': 'assets/img/produto-misto-5kg.jpeg',
    'misto-10': 'assets/img/produto-misto-10kg.jpeg',
    'premium-10': 'assets/img/produto-premium-10kg.jpeg'
  };

  PRODUTOS = produtos.map(produto => {
    const chaveImagem = `${String(produto.categoria || '').toLowerCase()}-${Number(produto.peso)}`;
    const imagemAPI = String(produto.imagem || '');
    const imagem = /^https?:\/\//i.test(imagemAPI)
      ? imagemAPI
      : imagensLocais[chaveImagem] || imagemAPI || 'assets/favicon.svg';
    return {
      ...produto,
      id: Number(produto.id),
      preco: Number(produto.preco),
      peso: Number(produto.peso),
      disponivel: Number(produto.disponivel),
      nome: protegido(produto.nome),
      descricao: protegido(produto.descricao),
      categoria: protegido(produto.categoria),
      imagem: protegido(imagem)
    };
  });

  return PRODUTOS;
}



/* Dados da loja usados no rodapé, na retirada e na taxa de entrega.
   (No banco isso vem da tabela "comerciante".) */
const LOJA = {
  nome: 'Carvão do Pedro',
  endereco: 'Rua Joaquim da Rocha, 5270 · Castanheira · Porto Velho/RO',
  telefone: '(69) 99999-0000',
  horario: 'Segunda a sábado, das 8h às 18h',
  taxaEntrega: 8.0,
  atendimento: 'ambos'   // 'ambos', 'entrega' ou 'retirada' (o Pedro escolhe no painel)
};
  /* Os dados acima são só a reserva. Os de verdade vêm do painel do Pedro
   (rota /comercio). Ficam guardados na aba do navegador para a próxima
   página já abrir certa, e são buscados de novo a cada página. */
try { Object.assign(LOJA, JSON.parse(sessionStorage.getItem('carvao_loja')) || {}); } catch {}

// "Pedro da Silva ME · CNPJ 12.345.678/0001-90" (Decreto 7.962/2013).
// Fica vazio enquanto o Pedro não preencher no painel.
function textoEmpresa() {
  if (!LOJA.documento) return '';
  const tipo = LOJA.documento.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ';
  return `${LOJA.razao_social || LOJA.nome} · ${tipo} ${LOJA.documento}`;
}
function preencherEmpresa() {
  document.querySelectorAll('[data-loja-empresa]').forEach(campo => {
    campo.textContent = textoEmpresa();
    campo.hidden = !campo.textContent;
  });
}
// Escreve um dado da loja numa marcação que se atualiza sozinha
function campoLoja(campo) {
  return `<span data-loja="${campo}">${escaparHTML(LOJA[campo] || '')}</span>`;
}

// Busca depois que a página inteira carregou (as outras ferramentas já existem)
const lojaCarregada = new Promise(pronto => document.addEventListener('DOMContentLoaded', pronto))
  .then(() => requisicaoAPI('/comercio'))
  .then(dados => {
    const novos = {};
    if (dados.nome_comercio) novos.nome = dados.nome_comercio;
    if (dados.endereco) novos.endereco = dados.endereco;
    if (dados.telefone) novos.telefone = dados.telefone;
    if (dados.horario) novos.horario = dados.horario;
    novos.razao_social = dados.razao_social || ''; // Nome e CNPJ podem ser apagados no painel, então sempre usamos o que veio
    novos.documento = dados.documento || '';
    novos.atendimento = dados.atendimento || 'ambos';
    Object.assign(LOJA, novos);
    try { sessionStorage.setItem('carvao_loja', JSON.stringify(novos)); } catch {}
    document.querySelectorAll('[data-loja]').forEach(campo => {
      campo.textContent = LOJA[campo.dataset.loja] || '';
    });
    preencherEmpresa();
    return LOJA;
  })
  .catch(() => LOJA);   // se a API falhar, fica com a reserva
