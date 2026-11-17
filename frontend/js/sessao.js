const CHAVE_SESSAO = 'carvao_sessao';

async function cadastrar({ nome, email, whatsapp, senha }) {
  const emailNormalizado = email.trim().toLowerCase();
  await requisicaoAPI('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify({
      nome: nome.trim(),
      email: emailNormalizado,
      whatsapp: whatsapp.trim(),
      senha
    })
  });
  const resultado = await entrar(emailNormalizado, senha);
  if (!resultado.ok) throw new Error(resultado.erro);
  const sessao = clienteLogado();
  iniciarSessao({ ...sessao, whatsapp: whatsapp.trim() }, sessao.token);
  return { ok: true };
}

async function entrar(email, senha) {
  const resposta = await requisicaoAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), senha })
  });
  if (resposta.tipo !== 'cliente') {
    return { ok: false, erro: 'Esta área está disponível apenas para clientes.' };
  }
  iniciarSessao({ ...resposta.usuario, tipo: resposta.tipo }, resposta.token);
  return { ok: true };
}

function iniciarSessao(cliente, token) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ ...cliente, token }));
}

function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
  window.location.href = 'index.html';
}

function clienteLogado() {
  const sessao = lerJSON(CHAVE_SESSAO, null);
  return sessao && sessao.tipo === 'cliente' && sessao.token ? sessao : null;
}

function exigirLogin() {
  const cliente = clienteLogado();
  if (!cliente) {
    const destino = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login.html?voltar=${destino}`);
  }
  return cliente;
}
