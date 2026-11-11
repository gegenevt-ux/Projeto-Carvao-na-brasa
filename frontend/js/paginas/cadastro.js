/* =========================================================
   CADASTRO.JS — tela cadastro.html
   ========================================================= */

if (clienteLogado()) location.replace(destinoDepoisDoLogin());

montarLayout(null, { simples: true });
aplicarIcones();
ativarMostrarSenha();
ativarMascaras();

const voltar = parametroDaURL('voltar');
if (voltar) document.getElementById('link-login').href = `login.html?voltar=${encodeURIComponent(voltar)}`;

const form = document.getElementById('form-cadastro');
const erroGeral = document.getElementById('erro-geral');
ativarValidacaoAoVivo(form);

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  erroGeral.textContent = '';

  if (!validarFormulario(form)) return;

  const resultado = cadastrar({
    nome: form.nome.value,
    email: form.email.value,
    whatsapp: form.whatsapp.value,
    senha: form.senha.value
  });

  if (!resultado.ok) {
    erroGeral.textContent = resultado.erro;
    form.email.focus();
    return;
  }
  location.href = destinoDepoisDoLogin();   // cadastrou = já entra logado
});
