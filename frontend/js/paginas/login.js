/* =========================================================
   LOGIN.JS — tela login.html
   ========================================================= */

// Já está logado? Não faz sentido ver o login.
if (clienteLogado()) location.replace(destinoDepoisDoLogin());

// O Pedro já logado vai direto para o painel dele
const sessaoAtual = lerJSON(CHAVE_SESSAO, null);
if (sessaoAtual && sessaoAtual.tipo === 'comerciante' && sessaoAtual.token) location.replace('painel.html');

montarLayout(null, { simples: true });
aplicarIcones();
ativarMostrarSenha();

// Mantém o "voltar" se a pessoa preferir se cadastrar
const voltar = parametroDaURL('voltar');
if (voltar) document.getElementById('link-cadastro').href = `cadastro.html?voltar=${encodeURIComponent(voltar)}`;

const form = document.getElementById('form-login');
const erroGeral = document.getElementById('erro-geral');
ativarValidacaoAoVivo(form);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();          // não recarrega a página
  erroGeral.textContent = '';

  if (!validarFormulario(form)) return;

  try {
    const resultado = await entrar(form.email.value, form.senha.value);
    if (!resultado.ok) {
      erroGeral.textContent = resultado.erro;
      form.senha.value = '';
      form.senha.focus();
      return;
    }
    location.href = resultado.tipo === 'comerciante' ? 'painel.html' : destinoDepoisDoLogin();
  } catch (erro) {
    erroGeral.textContent = erro.message;
    form.senha.value = '';
    form.senha.focus();
  }
});
