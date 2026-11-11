/* =========================================================
   FORMULARIOS.JS — ajudas para os formulários
   (login, cadastro e finalizar pedido usam as mesmas)
   ========================================================= */

/* Mensagens em português para cada tipo de erro do HTML5.
   O navegador já sabe SE o campo é inválido (required,
   type="email", minlength); nós só escolhemos o TEXTO. */
function mensagemDeErro(campo) {
  const v = campo.validity;
  if (v.valueMissing) return 'Preencha este campo.';
  if (v.typeMismatch && campo.type === 'email') return 'Digite um e-mail válido, como nome@exemplo.com.';
  if (v.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
  if (v.patternMismatch || v.customError) return campo.validationMessage || 'Valor inválido.';
  return '';
}

/* Mostra ou limpa o erro de UM campo */
function validarCampo(campo) {
  const mensagem = campo.checkValidity() ? '' : mensagemDeErro(campo);
  const caixaErro = document.getElementById(`erro-${campo.id}`);
  if (caixaErro) caixaErro.textContent = mensagem;
  campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
  return !mensagem;
}

/* Valida o formulário inteiro e coloca o foco no 1º erro.
   Só valida campos visíveis (ex.: endereço some na retirada). */
function validarFormulario(form) {
  const campos = [...form.querySelectorAll('input, textarea')]
    .filter(c => c.type !== 'radio' && c.offsetParent !== null);
  const invalidos = campos.filter(c => !validarCampo(c));
  if (invalidos.length) invalidos[0].focus();
  return invalidos.length === 0;
}

/* Depois que a pessoa sai do campo, o erro some assim que ela corrige.
   (Não mostramos erro enquanto ela ainda está digitando pela 1ª vez.) */
function ativarValidacaoAoVivo(form) {
  form.querySelectorAll('input, textarea').forEach(campo => {
    campo.addEventListener('blur', () => { if (campo.value) validarCampo(campo); });
    campo.addEventListener('input', () => {
      if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
    });
  });
}

/* Máscara de telefone: 69999991234 -> (69) 99999-1234 */
function mascararTelefone(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 11);   // só números, até 11
  if (n.length <= 2) return n.length ? `(${n}` : '';
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function ativarMascaras() {
  document.querySelectorAll('[data-mascara="telefone"]').forEach(campo => {
    campo.addEventListener('input', () => {
      campo.value = mascararTelefone(campo.value);
      // Celular precisa ter 10 ou 11 dígitos
      const digitos = campo.value.replace(/\D/g, '').length;
      campo.setCustomValidity(digitos >= 10 || digitos === 0 ? '' : 'Digite o DDD e o número completo.');
    });
  });
}

/* Botão do "olhinho" que mostra/esconde a senha */
function ativarMostrarSenha() {
  document.querySelectorAll('[data-alternar-senha]').forEach(botao => {
    const campo = document.getElementById(botao.dataset.alternarSenha);
    botao.innerHTML = icone('olhoFechado');
    botao.addEventListener('click', () => {
      const mostrando = campo.type === 'text';
      campo.type = mostrando ? 'password' : 'text';
      botao.innerHTML = icone(mostrando ? 'olhoFechado' : 'olho');
      botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Esconder senha');
    });
  });
}

/* Coloca ícones marcados no HTML com data-icone / data-icone-antes */
function aplicarIcones() {
  document.querySelectorAll('[data-icone]').forEach(el => { el.innerHTML = icone(el.dataset.icone); });
  document.querySelectorAll('[data-icone-antes]').forEach(el => {
    el.insertAdjacentHTML('afterbegin', icone(el.dataset.iconeAntes));
  });
}

/* Para onde ir depois do login/cadastro.
   Aceita só nomes de páginas nossas (ex.: "carrinho.html"),
   para ninguém usar o link para mandar a pessoa a outro site. */
function destinoDepoisDoLogin() {
  const voltar = parametroDaURL('voltar') || '';
  return /^[a-z-]+\.html(\?[\w=&-]*)?$/.test(voltar) ? voltar : 'index.html';
}
