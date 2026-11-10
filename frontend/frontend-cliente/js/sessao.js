/* =========================================================
   SESSAO.JS — cadastro, login e "quem está logado"
   ---------------------------------------------------------
   ⚠️ SIMULAÇÃO: enquanto o backend não tem as rotas de
   login, os clientes ficam salvos no localStorage do
   navegador. Isso é só para o protótipo funcionar.
   No sistema real:
     - cadastrar() vira  POST /api/clientes
     - entrar()    vira  POST /api/login
     - a senha NUNCA fica no navegador (o backend guarda
       a senha criptografada, com bcrypt por exemplo).
   Os campos seguem a tabela "cliente": nome, email,
   senha, whatsapp.
   ========================================================= */

const CHAVE_CLIENTES = 'carvao_clientes';
const CHAVE_SESSAO = 'carvao_sessao';

/* Cliente de demonstração, para testar sem se cadastrar */
const CLIENTE_DEMO = {
  id: 1,
  nome: 'João da Silva',
  email: 'joao@exemplo.com',
  senha: '123456',
  whatsapp: '(69) 99999-1234'
};

/* --- Clientes --- */
function listarClientes() {
  return lerJSON(CHAVE_CLIENTES, [CLIENTE_DEMO]);
}

function cadastrar({ nome, email, whatsapp, senha }) {
  const clientes = listarClientes();
  const emailNormalizado = email.trim().toLowerCase();

  if (clientes.some(c => c.email === emailNormalizado)) {
    return { ok: false, erro: 'Já existe uma conta com este e-mail.' };
  }

  const novo = {
    id: Math.max(...clientes.map(c => c.id)) + 1,
    nome: nome.trim(),
    email: emailNormalizado,
    whatsapp: whatsapp.trim(),
    senha
  };
  salvarJSON(CHAVE_CLIENTES, [...clientes, novo]);
  iniciarSessao(novo);
  return { ok: true };
}

/* --- Login / logout --- */
function entrar(email, senha) {
  const cliente = listarClientes().find(
    c => c.email === email.trim().toLowerCase() && c.senha === senha
  );
  if (!cliente) return { ok: false, erro: 'E-mail ou senha incorretos.' };
  iniciarSessao(cliente);
  return { ok: true };
}

function iniciarSessao(cliente) {
  // Guardamos só o necessário. Nunca a senha.
  const { id, nome, email, whatsapp } = cliente;
  salvarJSON(CHAVE_SESSAO, { id, nome, email, whatsapp });
}

function sair() {
  try { localStorage.removeItem(CHAVE_SESSAO); } catch (erro) { /* ignora */ }
  window.location.href = 'index.html';
}

/* Devolve o cliente logado ou null (visitante) */
function clienteLogado() {
  return lerJSON(CHAVE_SESSAO, null);
}

/* "Guarda" de página: telas como carrinho e meus pedidos
   só abrem logado. Se for visitante, manda para o login
   e guarda para onde ele queria ir (?voltar=...). */
function exigirLogin() {
  const cliente = clienteLogado();
  if (!cliente) {
    const destino = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login.html?voltar=${destino}`);
  }
  return cliente;
}
