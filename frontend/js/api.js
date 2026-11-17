const API_BASE_URL = 'https://carvao-na-brasa-api.vercel.app';

async function requisicaoAPI(caminho, opcoes = {}) {
  const cabecalhos = {
    Accept: 'application/json',
    ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
    ...opcoes.headers
  };
  const sessao = lerJSON('carvao_sessao', null);
  if (sessao && sessao.token) {
    cabecalhos.Authorization = `Bearer ${sessao.token}`;
  }

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    ...opcoes,
    headers: cabecalhos
  });
  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      throw new Error('A API retornou uma resposta inválida.');
    }
  }

  if (!resposta.ok) {
    const erro = new Error(dados && dados.erro ? dados.erro : `Erro na API (${resposta.status}).`);
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}
