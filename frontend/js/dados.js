let PRODUTOS = [];

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
      imagem
    };
  });

  return PRODUTOS;
}



/* Dados da loja usados no rodapé, na retirada e na taxa de entrega.
   (No banco isso vem da tabela "comerciante".) */
const LOJA = {
  nome: 'Carvão do Pedro',
  endereco: 'Rua das Castanheiras, 120 · Centro · Porto Velho/RO',
  telefone: '(69) 99999-0000',
  horario: 'Segunda a sábado, das 8h às 18h',
  taxaEntrega: 8.0
};
