/* =========================================================
   PAGINAS/INFORMACOES.JS — privacidade.html e trocas.html
   Páginas de texto. Só monta o topo/rodapé e preenche os
   dados da loja (endereço, telefone e horário).
   ========================================================= */

montarLayout(null);

document.querySelectorAll('[data-loja]').forEach(campo => {
  campo.textContent = LOJA[campo.dataset.loja] || '';
});
