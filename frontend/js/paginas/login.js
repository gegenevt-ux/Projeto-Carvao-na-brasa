/* =========================================================
   LOGIN.JS — tela login.html
   ========================================================= */

// Já está logado? Não faz sentido ver o login.
if (clienteLogado()) location.replace(destinoDepoisDoLogin());

montarLayout(null, { simples: true });
aplicarIcones();
ativarMostrarSenha();

// Mantém o "voltar" se a pessoa preferir se cadastrar
const voltar = parametroDaURL('voltar');
if (voltar) document.getElementById('link-cadastro').href = `cadastro.html?voltar=${encodeURIComponent(voltar)}`;

const form = document.getElementById('form-login');
const erroGeral = document.getElementById('erro-geral');
ativarValidacaoAoVivo(form);

form.addEventListener('submit', (evento) => {
  evento.preventDefault();          // não recarrega a página
  erroGeral.textContent = '';

  if (!validarFormulario(form)) return;

  const resultado = entrar(form.email.value, form.senha.value);
  if (!resultado.ok) {
    erroGeral.textContent = resultado.erro;
    form.senha.value = '';
    form.senha.focus();
    return;
  }
  location.href = destinoDepoisDoLogin();
});
