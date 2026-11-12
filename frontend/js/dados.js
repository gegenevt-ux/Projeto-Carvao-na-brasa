/* =========================================================
   DADOS.JS — produtos e informações da loja
   ---------------------------------------------------------
   Os campos do produto têm os MESMOS nomes da tabela
   "produto" do banco (banco/criar_banco.sql): id, nome,
   descricao, preco, peso, categoria, disponivel, imagem.
   Quando a API existir, esta lista vira um:
       const PRODUTOS = await fetch('/api/produtos').then(r => r.json());
   ========================================================= */

const PRODUTOS = [
  {
    id: 1,
    nome: 'Carvão vegetal',
    descricao: 'Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',
    preco: 18.0,
    peso: 3,
    categoria: 'Tradicional',
    disponivel: 1,
    imagem: 'assets/img/produto-tradicional-3kg.jpg'
  },
  {
    id: 2,
    nome: 'Carvão vegetal',
    descricao: 'O tamanho certo para reunir a turma ao redor da churrasqueira. Carvão selecionado em pedaços, com brasa duradoura para você aproveitar cada momento.',
    preco: 28.0,
    peso: 5,
    categoria: 'Tradicional',
    disponivel: 1,
    imagem: 'assets/img/produto-tradicional-5kg.jpg'
  },
  {
    id: 3,
    nome: 'Carvão vegetal',
    descricao: 'Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',
    preco: 18.0,
    peso: 3,
    categoria: 'Misto',
    disponivel: 1,
    imagem: 'assets/img/produto-misto-5kg.jpeg'
  },
    {
    id: 4,
    nome: 'Carvão vegetal',
    descricao: 'Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',
    preco: 18.0,
    peso: 3,
    categoria: 'Misto',
    disponivel: 1,
    imagem: 'assets/img/produto-misto-10kg.jpeg'
  },
  {
    id: 5,
    nome: 'Carvão vegetal premium',
    descricao: 'Um pacote maior para churrascos que pedem mais tempo de brasa. Carvão selecionado em pedaços grandes, pensado para encontros com a turma toda.',
    preco: 52.0,
    peso: 10,
    categoria: 'Premium',
    disponivel: 0,
    imagem: 'assets/img/produto-premium-10kg.jpeg'
  }
];



/* Dados da loja usados no rodapé, na retirada e na taxa de entrega.
   (No banco isso vem da tabela "comerciante".) */
const LOJA = {
  nome: 'Carvão do Pedro',
  endereco: 'Rua das Castanheiras, 120 · Centro · Porto Velho/RO',
  telefone: '(69) 99999-0000',
  horario: 'Segunda a sábado, das 8h às 18h',
  taxaEntrega: 8.0
};
