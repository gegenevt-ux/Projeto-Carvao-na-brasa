/* =========================================================
   INICIO.JS — só o que é da tela inicial (index.html)
   ========================================================= */

montarLayout('inicio', { rodapeCompleto: true });

const cliente = clienteLogado();

/* Ícones que dependem do icones.js */
document.getElementById('hero-local').innerHTML = `${icone('local')} Porto Velho · Rondônia`;
document.getElementById('btn-escolher').insertAdjacentHTML('afterbegin', icone('seta'));
document.getElementById('link-todos').insertAdjacentHTML('beforeend', icone('seta'));
document.getElementById('cta-icone').innerHTML = icone('sacola');
document.getElementById('btn-cta').insertAdjacentHTML('afterbegin', icone('seta'));

/* Benefícios: uma lista de dados vira HTML com map() */
const beneficios = [
  { icone: 'chama',    titulo: 'Brasa duradoura',        texto: 'Mais tempo de brasa, mais tempo junto.' },
  { icone: 'escudo',   titulo: 'Carvão selecionado',     texto: 'Qualidade que começa no pacote.' },
  { icone: 'caminhao', titulo: 'Entrega em Porto Velho', texto: 'Receba em casa ou retire na loja.' }
];
document.getElementById('beneficios').innerHTML = beneficios.map(b => `
  <li class="beneficio">
    <span class="beneficio-icone">${icone(b.icone)}</span>
    <div><strong>${b.titulo}</strong><span>${b.texto}</span></div>
  </li>`).join('');

/* Cards: visitante vê "Ver produto"; logado já pode adicionar */
const grade = document.getElementById('destaques');
grade.innerHTML = PRODUTOS.slice(0, 3)
  .map(p => criarCardProduto(p, cliente ? 'adicionar' : 'ver'))
  .join('');
ativarBotoesAdicionar(grade);

/* Quem já tem conta não precisa de "Criar conta" nem da chamada */
if (cliente) {
  document.getElementById('btn-criar-conta').remove();
  document.getElementById('cta').remove();
}
