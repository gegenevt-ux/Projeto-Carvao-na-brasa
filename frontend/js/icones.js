/* =========================================================
   ICONES.JS — todos os ícones da loja em um lugar só
   ---------------------------------------------------------
   Por que não usar <img src="assets/icones/x.svg">?
   Porque um SVG dentro de <img> tem a cor "travada" no
   arquivo. Desenhando o SVG direto no HTML com
   stroke="currentColor", o ícone pega a cor do texto:
   branco no botão laranja, laranja no link, cinza no texto.

   Uso: icone('seta')  ->  devolve o HTML do <svg>
   ========================================================= */

const ICONES = {
  chama:      '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  local:      '<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  escudo:     '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  caminhao:   '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
  loja:       '<path d="M4 9l2-5h12l2 5M4 9v11h16V9M4 9h16M9 20v-5h6v5"/>',
  sacola:     '<path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0"/>',
  seta:       '<path d="M5 12h14M13 6l6 6-6 6"/>',
  voltar:     '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  entrar:     '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4"/>',
  sair:       '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 16l4-4-4-4M18 12H8"/>',
  mais:       '<path d="M12 5v14M5 12h14"/>',
  menos:      '<path d="M5 12h14"/>',
  usuario:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18a6 6 0 0 1 11 0"/>',
  baixo:      '<path d="M6 9l6 6 6-6"/>',
  direita:    '<path d="M9 6l6 6-6 6"/>',
  busca:      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  camera:     '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  olho:       '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  olhoFechado:'<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  check:      '<path d="M5 13l4 4L19 7"/>',
  info:       '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  xCirculo:   '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
  lixeira:    '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  carteira:   '<path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4z"/><path d="M4 6l11-3v3M16 13h.01"/>'
};

function icone(nome, classe = 'icone') {
  return `<svg class="${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;
}
