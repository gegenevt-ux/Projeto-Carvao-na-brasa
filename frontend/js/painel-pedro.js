/* Painel do Pedro — telas do comerciante (seguem o protótipo do Figma).
   Os pedidos, produtos e dados da loja vêm da API do projeto (mesmo banco do site). */
(() => {
  'use strict';

  /* ---------- Guarda: só o comerciante entra (usa a sessão da loja) ---------- */
  const sessao = (() => { try { return JSON.parse(localStorage.getItem('carvao_sessao')); } catch { return null; } })();
  if (!sessao || !sessao.token) { location.replace('login.html'); return; }
  if (sessao.tipo !== 'comerciante') { location.replace('index.html'); return; }

  /* ---------- Conversa com a API (o token do login vai junto em todo pedido) ---------- */
  const API = 'https://carvao-na-brasa-api.vercel.app';
  async function api(caminho, opcoes = {}) {
    const resposta = await fetch(API + caminho, {
      ...opcoes,
      headers: { Accept: 'application/json', ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${sessao.token}` }
    });
    const dados = await resposta.json().catch(() => null);
    // Login vencido (dura 2 horas): limpa a sessão e volta para o login
    if (resposta.status === 401) { try { localStorage.removeItem('carvao_sessao'); } catch {} location.replace('login.html'); throw new Error('Faça login de novo.'); }
    if (!resposta.ok) throw new Error(dados?.erro || `Erro na API (${resposta.status}).`);
    return dados;
  }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const money = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Ícones (traço fino, como no protótipo) ---------- */
  const P = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-2-.9 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-2 .9 2 2 0 0 1-2-2V7"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    upright: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    imageplus: '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M16 5h6"/><path d="M19 2v6"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    circlex: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    circlecheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
  const paintIcons = (root = document) => {
    $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon, el.dataset.cls || ''); });
    $$('[data-icon-after]', root).forEach(el => { if (!el.querySelector('svg')) el.insertAdjacentHTML('beforeend', icon(el.dataset.iconAfter)); });
    $$('[data-icon-before]', root).forEach(el => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.iconBefore)); });
  };

  /* ---------- Menu lateral, topo e rodapé (iguais em todas as telas) ---------- */
  const nav = [
    ['painel', 'Painel', 'painel.html', 'dashboard'],
    ['produtos', 'Produtos', 'produtos.html', 'package'],
    ['pedidos', 'Pedidos', 'pedidos.html', 'clipboard'],
    ['comercio', 'Meu comércio', 'comercio.html', 'store']
  ];
  const crumb = (nav.find(n => n[0] === page) || [])[1] || '';
  $('#pp-sidebar').innerHTML = `
    <a class="pp-brand" href="painel.html"><span class="pp-brand-icon">${icon('flame')}</span><span class="pp-brand-name">CARVÃO DO<br>PEDRO</span></a>
    <span class="pp-sidebar-label">ÁREA DO PEDRO</span>
    <nav class="pp-nav">${nav.map(([id, t, href, ic]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${icon(ic)}${t}${id === 'pedidos' ? '<span class="pp-nav-count" id="pp-nav-count" hidden></span>' : ''}</a>`).join('')}</nav>
    <div class="pp-user"><span class="pp-avatar">${esc((sessao.nome || 'P').charAt(0).toUpperCase())}</span><span><strong>${esc(sessao.nome || 'Pedro')}</strong><small>Administrador</small></span><button class="pp-logout" type="button" id="pp-logout" title="Sair do painel" aria-label="Sair do painel">${icon('logout')}</button></div>`;
  $('#pp-topbar').innerHTML = `
    <div class="pp-topbar-crumb"><button class="pp-mobile-menu" type="button" aria-label="Abrir menu" data-menu-toggle>${icon('menu')}</button>Carvão do Pedro / ${crumb}</div>
    <div class="pp-topbar-actions"><a href="index.html" target="_blank" rel="noopener">${icon('external')}Ver loja</a><a class="pp-bell" id="pp-bell" href="pedidos.html" aria-label="Pedidos pendentes: nenhum">${icon('bell')}<span class="pp-bell-count" id="pp-bell-count" hidden></span></a></div>`;
  $('#pp-footer').innerHTML = '<span>Carvão do Pedro · Gestão do comércio</span>';
  paintIcons();

  $('#pp-logout').addEventListener('click', () => { try { localStorage.removeItem('carvao_sessao'); } catch {} location.href = 'index.html'; });
  const sidebar = $('#pp-sidebar');
  $('[data-menu-toggle]')?.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => { if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('[data-menu-toggle]')) sidebar.classList.remove('open'); });

  /* ---------- Aviso (toast) com "Desfazer" opcional ---------- */
  const toastEl = $('.pp-toast');
  const toast = (msg, undo) => {
    toastEl.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Desfazer</button>' : ''}`;
    if (undo) $('button', toastEl).onclick = () => { toastEl.classList.remove('show'); undo(); };
    toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), undo ? 6000 : 2800);
  };
  /* ---------- Aviso de pedido novo (em todas as telas do painel) ----------
     A cada 30 segundos pergunta à API quantos pedidos estão pendentes.
     Mostra o número na campainha e no menu "Pedidos", no título da aba,
     e avisa quando chega um pedido que ainda não tinha aparecido. */
  const tituloBase = document.title;
  let maiorPedidoVisto = null;
  async function verificarPedidosNovos() {
    let pendentes;
    try { pendentes = await api('/pedidos?status=pendente'); } catch { return; }
    const qtd = pendentes.length;
    const texto = qtd ? String(qtd) : '';
    ['#pp-bell-count', '#pp-nav-count'].forEach(sel => { const el = $(sel); if (el) { el.textContent = texto; el.hidden = !qtd; } });
    $('#pp-bell').setAttribute('aria-label', `Pedidos pendentes: ${qtd || 'nenhum'}`);
    document.title = (qtd ? `(${qtd}) ` : '') + tituloBase;
    const maior = Math.max(0, ...pendentes.map(o => Number(o.id)));
    if (maiorPedidoVisto !== null && maior > maiorPedidoVisto) {
      toast(`Chegou um pedido novo: #${maior}.`);
      document.dispatchEvent(new CustomEvent('pedido-novo'));
    }
    maiorPedidoVisto = Math.max(maiorPedidoVisto || 0, maior);
  }
  verificarPedidosNovos();
  setInterval(verificarPedidosNovos, 30000);
   
  /* ---------- Janelas ---------- */
  const openModal = (m, focusSel) => { m.classList.add('open'); setTimeout(() => $(focusSel, m)?.focus(), 30); };
  const closeModal = m => m.classList.remove('open');
  $$('.pp-modal-backdrop').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close-modal]')) closeModal(m); });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.pp-modal-backdrop.open').forEach(closeModal); });

  /* ---------- Dados da API → formato que as telas usam ---------- */
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const IMG = { 3: 'assets/img/produto-tradicional-3kg.jpg', 5: 'assets/img/produto-tradicional-5kg.jpg', 10: 'assets/img/produto-premium-10kg.jpeg' };
  const imgDe = p => p.image || IMG[p.weight] || IMG[5];
  const kg = v => String(Number(v) || 0).replace('.', ',');

  const deProduto = p => ({
    id: Number(p.id), name: p.nome, weight: Number(p.peso) || 0, price: Number(p.preco) || 0,
    category: p.categoria || '', description: p.descricao || '', active: Number(p.disponivel) === 1, image: p.imagem || ''
  });

  // O banco usa os status em português; as telas, as chaves abaixo
  const DA_API = { pendente: 'pending', preparando: 'preparing', pronto: 'ready', concluido: 'done', cancelado: 'cancelled' };
  const PARA_API = Object.fromEntries(Object.entries(DA_API).map(([pt, en]) => [en, pt]));
  // O banco guarda a hora em UTC ("2026-11-17 14:26:13"); aqui vira a hora de Porto Velho
  const quando = s => new Date(String(s).replace(' ', 'T') + 'Z');
  const diaLocal = d => d.toLocaleDateString('sv-SE');   // AAAA-MM-DD no fuso do computador

  let enderecoLoja = '';
  const dePedido = o => {
    const d = quando(o.data), entrega = o.recebimento === 'entrega';
    const itens = o.itens || [];
    return {
      id: Number(o.id), customer: o.cliente_nome || 'Cliente', phone: o.cliente_whatsapp || '',
      items: itens.map(i => `${i.quantidade} × ${i.nome} ${kg(i.peso)} kg`).join(' · '),
      subtotal: itens.reduce((t, i) => t + Number(i.preco_unitario) * Number(i.quantidade), 0),
      fee: Number(o.taxa_entrega) || 0, total: Number(o.total) || 0,
      address: entrega ? [o.endereco_entrega, o.bairro].filter(Boolean).join(' · ') : (enderecoLoja || 'Na loja'),
      note: o.observacao || '', type: entrega ? 'Entrega' : 'Retirada', status: DA_API[o.status] || o.status,
      payment: ({ pix: 'Pix pelo site', dinheiro: 'Dinheiro', cartao: 'Cartão' })[o.forma_pagamento] || '',
      change: o.forma_pagamento === 'dinheiro' ? (o.troco_para ? `troco para ${money(Number(o.troco_para))}` : 'sem troco')
        : o.forma_pagamento === 'pix' ? (Number(o.pago) ? 'pago' : 'aguardando pagamento') : '',
      date: diaLocal(d), time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  let products = [], orders = [];
  const carregarProdutos = async () => { products = (await api('/produtos')).map(deProduto); };
  const carregarPedidos = async () => { orders = (await api('/pedidos')).map(dePedido); };
  const carregarLoja = async () => { try { return await api('/comercio'); } catch { return {}; } };

  const STATUS = { pending: 'Pendente', preparing: 'Preparando', ready: 'Pronto', done: 'Concluído', cancelled: 'Cancelado' };
  const badge = s => `<span class="pp-status ${s}">${STATUS[s] || s}</span>`;
  const dataBR = d => d.split('-').reverse().join('/');
  const hoje = () => diaLocal(new Date());

  /* ---------- PAINEL ---------- */
  function renderDashboard() {
    if (page !== 'painel') return;
    $('#today-label').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const day = orders.filter(o => o.date === hoje());
    const pend = day.filter(o => o.status === 'pending').length;
    const andamento = day.filter(o => ['preparing', 'ready'].includes(o.status)).length;
    $('#stat-orders').textContent = day.length;
    $('#stat-orders-foot').textContent = `${pend} pendente${pend === 1 ? '' : 's'} · ${andamento} em andamento`;
    const ativos = products.filter(p => p.active).length, indisp = products.length - ativos;
    $('#stat-products').textContent = ativos;
    $('#stat-products-foot').textContent = `${products.length} cadastrados · ${indisp} ${indisp === 1 ? 'indisponível' : 'indisponíveis'}`;
    const mes = hoje().slice(0, 7);   // AAAA-MM
    $('#stat-sales').textContent = money(orders.filter(o => o.status === 'done' && o.date.startsWith(mes)).reduce((s, o) => s + o.subtotal, 0));

    const novo = [...orders].reverse().find(o => o.status === 'pending');   // o mais antigo esperando
    $('#pp-notice').innerHTML = novo
      ? `<div class="pp-notice-main">${icon('clock')}<div><strong>Tem pedido novo esperando por você.</strong><span class="sub">Pedido #${novo.id} · ${esc(novo.customer)} · ${novo.type} · ${money(novo.total)}</span></div></div><a class="pp-btn light" href="pedidos.html">Conferir pedido</a>`
      : `<div class="pp-notice-main">${icon('circlecheck')}<div><strong>Tudo em dia por aqui.</strong><span class="sub">Nenhum pedido aguardando confirmação.</span></div></div><a class="pp-btn light" href="pedidos.html">Ver pedidos</a>`;

    $('#dashboard-orders').innerHTML = orders.slice(0, 5).map(o => `
      <div class="pp-trow body">
        <strong>#${o.id}</strong>
        <div><strong style="font-size:13px">${esc(o.customer)}</strong><small>${dataBR(o.date)} · ${o.time}</small></div>
        <span class="c3">${o.type}</span><span>${badge(o.status)}</span>
        <strong class="c5" style="padding-left:30px">${money(o.total)}</strong>
        <a class="arrow" href="pedidos.html" aria-label="Abrir pedido #${o.id}">${icon('upright')}</a>
      </div>`).join('') || '<div class="pp-empty">Nenhum pedido ainda.</div>';
  }

  /* ---------- PRODUTOS ---------- */
  let editingId = null, pendingDeleteId = null, photoUrl = '', photoFile = '';
  const showPhoto = (src, name) => {
    $('#photo-empty').style.display = src ? 'none' : 'flex';
    $('#photo-filled').style.display = src ? 'flex' : 'none';
    if (src) { $('#photo-img').src = src; $('#photo-name').textContent = name; }
  };
  function resetProductForm() {
    editingId = null; photoUrl = ''; photoFile = '';
    $('#product-form').reset(); $('#product-description').style.height = ''; $('#product-id').value = ''; $('#product-active').checked = true;
    $('#product-card').classList.remove('editing');
    $('#product-form-title').textContent = 'Novo produto'; $('#product-form-sub').textContent = 'Cadastre um novo pacote no catálogo da loja.';
    $('#product-submit').innerHTML = `${icon('plus')}Cadastrar produto`; $('#product-reset').hidden = true;
    showPhoto('', ''); renderProducts();
  }
  const fitTextarea = () => { const t = $('#product-description'); t.style.height = 'auto'; t.style.height = Math.max(92, t.scrollHeight + 2) + 'px'; };
  function startEdit(p) {
    editingId = p.id; photoUrl = p.image || ''; photoFile = '';
    $('#product-name').value = p.name; $('#product-description').value = p.description || ''; $('#product-price').value = p.price.toFixed(2).replace('.', ',');
    $('#product-weight').value = String(p.weight).replace('.', ','); $('#product-category').value = p.category; $('#product-active').checked = p.active;
    fitTextarea();
    $('#product-card').classList.add('editing');
    $('#product-form-title').textContent = 'Editar produto'; $('#product-form-sub').textContent = 'Atualize os dados e salve as alterações.';
    $('#product-submit').innerHTML = `${icon('check')}Salvar alterações`; $('#product-reset').hidden = false;
    showPhoto(imgDe(p), `${slug(p.name)}-${p.weight}kg.jpg`); renderProducts();
  }
  function renderProducts() {
    if (page !== 'produtos') return;
    const q = ($('#product-search').value || '').trim().toLocaleLowerCase('pt-BR');
    const list = products.filter(p => `${p.name} ${p.category} ${p.weight}kg`.toLocaleLowerCase('pt-BR').includes(q));
    $('#product-count').textContent = `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`;
    $('#product-table').innerHTML = list.length ? list.map(p => `
      <div class="pp-prow body${p.id === editingId ? ' selected' : ''}">
        <div><strong>${esc(p.name)}</strong><small>Pacote de ${kg(p.weight)} kg</small></div>
        <span class="cat">${esc(p.category)}</span><span>${kg(p.weight)} kg</span><strong>${money(p.price)}</strong>
        <span>${p.active ? '<span class="pp-status active">Disponível</span>' : '<span class="pp-status off">Indisponível</span>'}</span>
        <div class="pp-acts"><button class="pp-link" type="button" data-edit="${p.id}">${icon('pencil')}Editar</button><button class="pp-link del" type="button" data-del="${p.id}">${icon('trash')}Excluir</button></div>
      </div>`).join('') : '<div class="pp-empty" style="background:#fff;border-top:1px solid #eceae4">Nenhum produto encontrado.</div>';
  }
  if (page === 'produtos') {
    $('#product-search').addEventListener('input', renderProducts);
    $('#product-reset').addEventListener('click', resetProductForm);
    $('#product-photo').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { toast('A foto precisa ter até 5 MB.'); e.target.value = ''; return; }
      photoFile = f.name; photoUrl = URL.createObjectURL(f); showPhoto(photoUrl, f.name);
    });
    $('#product-form').addEventListener('submit', async e => {
      e.preventDefault();
      const num = v => Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;
      const rec = { name: $('#product-name').value.trim(), weight: num($('#product-weight').value), price: num($('#product-price').value), category: $('#product-category').value, description: $('#product-description').value.trim(), active: $('#product-active').checked };
      if (!rec.name || !(rec.weight > 0) || !(rec.price > 0) || !rec.category) { toast('Preencha nome, preço, peso e categoria.'); return; }
      const corpo = { nome: rec.name, descricao: rec.description, preco: rec.price, peso: rec.weight, categoria: rec.category, disponivel: rec.active ? 1 : 0 };
      if (!editingId) corpo.imagem = IMG[rec.weight] || IMG[5];   // produto novo começa com a foto padrão do tamanho
      const botao = $('#product-submit'); botao.disabled = true;
      try {
        if (editingId) await api(`/produtos/${editingId}`, { method: 'PUT', body: JSON.stringify(corpo) });
        else await api('/produtos', { method: 'POST', body: JSON.stringify(corpo) });
        await carregarProdutos();
        const era = editingId, comFoto = photoFile; resetProductForm();
        toast((era ? 'Produto atualizado.' : 'Produto cadastrado.') + (comFoto ? ' A foto nova ainda não é enviada; ficou a foto atual.' : ''));
      } catch (erro) { toast(erro.message); }
      finally { botao.disabled = false; }
    });
   // Quando o formulário fica embaixo da tabela (tela menor), leva o Pedro até ele
    function mostrarFormulario() {
      const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      $('#product-card').scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
      $('#product-name').focus({ preventScroll: true });
    }
     $('#product-table').addEventListener('click', e => {
      const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (ed) { const p = products.find(x => x.id === Number(ed.dataset.edit)); if (p) { startEdit(p); mostrarFormulario(); } }
      if (del) {
        const p = products.find(x => x.id === Number(del.dataset.del)); if (!p) return; pendingDeleteId = p.id;
        $('#delete-img').src = imgDe(p); $('#delete-title').textContent = `${p.name} · ${p.weight} kg`; $('#delete-sub').textContent = `${p.category} · ${money(p.price)}`;
        openModal($('#product-modal'), '[data-close-modal].secondary');
      }
    });
    $('#confirm-delete-product').addEventListener('click', async () => {
      const id = pendingDeleteId; closeModal($('#product-modal')); pendingDeleteId = null;
      try {
        await api(`/produtos/${id}`, { method: 'DELETE' });
        await carregarProdutos();
        if (editingId === id) resetProductForm(); else renderProducts();
        toast('Produto excluído.');
      } catch (erro) { toast(erro.message); }   // ex.: produto que já foi vendido não pode ser excluído
    });
    carregarProdutos().then(resetProductForm).catch(erro => { resetProductForm(); toast(erro.message); });
  }

  /* ---------- PEDIDOS ---------- */
  let orderFilter = 'all', pendingCancelId = null, pendingCodeId = null;
  const footInfo = o => ({
    pending: ['info', 'Aguardando confirmação', ''],
    preparing: ['info', 'Separe os itens e confira as quantidades', ''],
    ready: ['info', o.type === 'Retirada' ? 'Pronto para retirada na loja' : 'Pronto para sair para entrega', ''],
    done: ['circlecheck', 'Pedido concluído · sem ações pendentes', 'ok'],
    cancelled: ['circlex', 'Pedido cancelado · sem ações disponíveis', 'bad']
  }[o.status]);
   // Abre o WhatsApp do cliente com uma mensagem pronta sobre o pedido
  function linkWhatsApp(o) {
    let numero = String(o.phone || '').replace(/\D/g, '');
    if (numero.length < 10) return '';
    if (numero.length <= 11) numero = '55' + numero;
    const msg = `Olá, ${o.customer}! Aqui é do Carvão do Pedro, sobre o seu pedido #${o.id}.`;
    return `<p><a class="pp-link-whatsapp" href="https://wa.me/${numero}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" aria-label="Chamar ${esc(o.customer)} no WhatsApp (abre em outra aba)">Chamar no WhatsApp</a></p>`;
  }
  function renderOrders() {
    if (page !== 'pedidos') return;
    const period = $('#order-period').value;
    const dia = hoje(), semana = diaLocal(new Date(Date.now() - 7 * 864e5)), mes = dia.slice(0, 8) + '01';
    const vis = orders.filter(o => (orderFilter === 'all' || o.status === orderFilter) && (period === 'all' || (period === 'today' ? o.date === dia : period === 'week' ? o.date >= semana : o.date >= mes)));
    $('#order-count').textContent = `${vis.length} ${vis.length === 1 ? 'pedido' : 'pedidos'}`;
    $('#order-list').innerHTML = vis.length ? vis.map(o => {
      const [ic, txt, cls] = footInfo(o);
      const adv = { pending: ['arrow', 'Aceitar e preparar'], preparing: ['arrow', 'Marcar como pronto'], ready: ['check', 'Concluir pedido'] }[o.status];
      // A loja só pode cancelar enquanto o pedido está pendente ou preparando (regra da API)
      const podeCancelar = ['pending', 'preparing'].includes(o.status);
      const acts = adv ? `<div class="pp-order-actions">${podeCancelar ? `<button class="pp-btn secondary" type="button" data-cancel="${o.id}">Cancelar</button>` : ''}<button class="pp-btn" type="button" data-advance="${o.id}">${icon(adv[0])}${adv[1]}</button></div>` : '';
      return `<article class="pp-card pp-order">
        <div class="pp-order-head"><div class="l"><span class="pp-order-id">Pedido #${o.id}</span>${badge(o.status)}</div><span class="pp-order-date">${dataBR(o.date)} · ${o.time}</span></div>
        <div class="pp-order-body">
          <div><span class="pp-order-label">Cliente</span><strong class="cname">${esc(o.customer)}</strong><p>${icon('phone')}${esc(o.phone)}</p>${linkWhatsApp(o)}</div>
          <div><span class="pp-order-label">Itens do pedido</span><strong>${esc(o.items)}</strong><p>Subtotal ${money(o.subtotal)}${o.note ? ` · Obs.: ${esc(o.note)}` : ''}</p></div>
          <div><span class="pp-order-label">${icon(o.type === 'Retirada' ? 'store' : 'truck')}${o.type === 'Retirada' ? 'Retirada na loja' : 'Entrega'}</span><strong>${esc(o.address)}</strong><p>Taxa ${money(o.fee)}</p><p><a class="pp-link-comprovante" href="comprovante.html?id=${o.id}">Imprimir comprovante</a></p>${o.payment ? `<p>Pagamento: ${esc(o.payment)}${o.change ? ` · ${esc(o.change)}` : ''}</p>` : ''}</div>
          <div class="pp-order-total"><span class="pp-order-label" style="justify-content:flex-end">Total</span><div class="v">${money(o.total)}</div></div>
        </div>
        <div class="pp-order-foot${acts ? '' : ' noact'}"><span class="${cls}">${icon(ic)}${txt}</span>${acts}</div>
      </article>`;
    }).join('') : '<div class="pp-card pp-empty">Nenhum pedido encontrado para este filtro.</div>';
  }
  if (page === 'pedidos') {
     // Pedido novo chegou: atualiza a lista sem precisar recarregar a página
    document.addEventListener('pedido-novo', () => carregarPedidos().then(renderOrders).catch(() => {}));
    $('#order-filters').addEventListener('click', e => {
      const b = e.target.closest('[data-status]'); if (!b) return;
      orderFilter = b.dataset.status; $$('#order-filters button').forEach(x => x.classList.toggle('active', x === b)); renderOrders();
    });
    $('#order-period').addEventListener('change', renderOrders);
    $('#order-list').addEventListener('click', e => {
      const adv = e.target.closest('[data-advance]'), can = e.target.closest('[data-cancel]');
      if (adv) {
        const o = orders.find(x => x.id === Number(adv.dataset.advance)); if (!o) return;
        const proximo = { pending: 'preparing', preparing: 'ready', ready: 'done' }[o.status]; if (!proximo) return;
         if (proximo === 'done') {   // para concluir, precisa do código que o cliente fala
          pendingCodeId = o.id; $('#code-input').value = ''; $('#code-error').textContent = '';
          $('#code-title').textContent = `Concluir pedido #${o.id}`;
          openModal($('#code-modal'), '#code-input'); return;
        }
        mudarStatus(o, proximo, adv);
      }
       
      if (can) {
        const o = orders.find(x => x.id === Number(can.dataset.cancel)); if (!o) return; pendingCancelId = o.id;
        $('#cancel-title-id').textContent = `Pedido #${o.id}`; $('#cancel-sub').textContent = `${o.customer} · ${money(o.total)}`;
        openModal($('#cancel-modal'), '#keep-order');   // o foco começa em "Manter pedido"
      }
    });

     $('#code-form').addEventListener('submit', async e => {
      e.preventDefault();
      const o = orders.find(x => x.id === pendingCodeId); if (!o) return;
      const codigo = $('#code-input').value.trim();
      if (!/^\d{4}$/.test(codigo)) { $('#code-error').textContent = 'Digite os 4 números do código.'; $('#code-input').focus(); return; }
      try {
        await api(`/pedidos/${o.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'concluido', codigo }) });
        closeModal($('#code-modal')); pendingCodeId = null;
        await carregarPedidos(); renderOrders(); toast(`Pedido #${o.id} concluído.`);
      } catch (erro) { $('#code-error').textContent = erro.message; $('#code-input').select(); }
     });
    $('#confirm-cancel-order').addEventListener('click', () => {
      const o = orders.find(x => x.id === pendingCancelId); if (!o) return;
      closeModal($('#cancel-modal')); pendingCancelId = null;
      mudarStatus(o, 'cancelled');   // cancelar não tem volta, por isso não há "Desfazer"
    });
    // Manda o novo status para a API e recarrega a lista
    async function mudarStatus(o, novo, botao) {
      if (botao) botao.disabled = true;
      try {
        await api(`/pedidos/${o.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: PARA_API[novo] }) });
        await carregarPedidos(); renderOrders();
        toast(`Pedido #${o.id} agora está ${STATUS[novo].toLowerCase()}.`);
      } catch (erro) { toast(erro.message); if (botao) botao.disabled = false; }
    }
    carregarLoja().then(l => { enderecoLoja = l.endereco || ''; return carregarPedidos(); })
      .then(renderOrders)
      .catch(erro => { renderOrders(); toast(erro.message); });
  }

  /* ---------- MEU COMÉRCIO ---------- */
  const keys = ['name', 'phone', 'street', 'number', 'neighborhood', 'city', 'hours'];
  function renderPreview() {
    const d = Object.fromEntries(keys.map(k => [k, $('#store-' + k).value]));
    $('#preview-address').textContent = `${d.street}, ${d.number} · ${d.neighborhood} · ${d.city}`;
    $('#preview-phone').textContent = d.phone; $('#preview-hours').textContent = d.hours;
    const doc = $('#store-doc').value.trim(), nums = doc.replace(/\D/g, '');
    $('#preview-legal').textContent = doc ? `${$('#store-legal').value.trim() || d.name} · ${nums.length === 11 ? 'CPF' : 'CNPJ'} ${doc}` : '';
    $('#preview-legal-row').hidden = !doc;
  }
  // O banco guarda o endereço numa linha só: "Rua, número · bairro · cidade"
  const separarEndereco = (e = '') => {
    const m = e.match(/^(.*?),\s*([^·]+?)\s*·\s*(.*?)\s*·\s*(.*)$/);
    return m ? { street: m[1], number: m[2], neighborhood: m[3], city: m[4] } : { street: e, number: '', neighborhood: '', city: '' };
  };
  if (page === 'comercio') {
    [...keys, 'legal', 'doc'].forEach(k => $('#store-' + k).addEventListener('input', renderPreview));
    carregarLoja().then(l => {
      const v = { name: l.nome_comercio || '', phone: l.telefone || '', hours: l.horario || '', ...separarEndereco(l.endereco || '') };
      keys.forEach(k => { $('#store-' + k).value = v[k] || ''; });
       $('#store-legal').value = l.razao_social || ''; $('#store-doc').value = l.documento || '';
      const servico = $(`[name="store-service"][value="${l.atendimento || 'ambos'}"]`); if (servico) servico.checked = true;
      renderPreview();
    });
    $('#store-form').addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(keys.map(k => [k, $('#store-' + k).value.trim()]));
      if (keys.some(k => !d[k])) { toast('Preencha todos os campos.'); return; }
      try {
        await api('/comercio', { method: 'PUT', body: JSON.stringify({
          nome_comercio: d.name, telefone: d.phone, horario: d.hours,
          endereco: `${d.street}, ${d.number} · ${d.neighborhood} · ${d.city}`,
          razao_social: $('#store-legal').value.trim(), documento: $('#store-doc').value.trim(),
          atendimento: ($('[name="store-service"]:checked') || {}).value || 'ambos'
        }) });
      const salvo = await carregarLoja(); $('#store-doc').value = salvo.documento || '';   // volta já formatado
        renderPreview(); toast('Dados do comércio salvos.');
      } catch (erro) { toast(erro.message); }
    });
  }

  // O painel precisa dos pedidos e dos produtos para montar os números
  if (page === 'painel') {
    Promise.all([carregarPedidos(), carregarProdutos()]).then(renderDashboard).catch(erro => { renderDashboard(); toast(erro.message); });
  }
})();
