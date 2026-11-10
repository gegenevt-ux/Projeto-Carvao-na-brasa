document.addEventListener('DOMContentLoaded', () => {
    const btnSalvar = document.getElementById('btn-salvar-produto');
    const btnCancelar = document.getElementById('btn-cancelar-edicao');
    
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    
    const nomeInput = document.getElementById('prod-nome-input');
    const descInput = document.getElementById('prod-desc-input');
    const precoInput = document.getElementById('prod-preco-input');
    const pesoInput = document.getElementById('prod-peso-input');
    const catSelect = document.getElementById('prod-cat-input');
    const ativoCheck = document.getElementById('prod-ativo-input');

    // Elementos da Foto
    const fotoInput = document.getElementById('prod-foto-input');
    const fotoPreviewContainer = document.getElementById('foto-preview-container');
    let imagemBase64Atual = '';

    let linhaEmEdicao = null; // Armazena a linha que está a ser editada (se houver)

    // Elementos do Modal de Exclusão
    const modalExcluir = document.getElementById('modal-excluir');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
    const modalProdNome = document.getElementById('modal-prod-nome');
    const modalProdInfo = document.getElementById('modal-prod-info');

    let linhaParaExcluir = null;

    // Função para exibir o Popup Estilizado (Toast)
    function mostrarToast(titulo, mensagem, tipo = 'sucesso') {
        const toast = document.getElementById('toast-notification');
        const toastTitle = document.getElementById('toast-title');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast) return;

        toastTitle.textContent = titulo;
        toastMessage.textContent = mensagem;
        
        if (tipo === 'sucesso') {
            toastIcon.textContent = '✅';
            toast.style.borderLeft = '4px solid #4CAF50';
        } else if (tipo === 'excluir') {
            toastIcon.textContent = '🗑️';
            toast.style.borderLeft = '4px solid #c62828';
        }

        toast.style.display = 'flex';

        // Esconder automaticamente após 3 segundos
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Gestão de Upload / Preview da Foto no Frontend
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    mostrarToast('Atenção', 'A imagem deve ter no máximo 5 MB.', 'excluir');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    imagemBase64Atual = event.target.result;
                    if (fotoPreviewContainer) {
                        fotoPreviewContainer.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <img src="${imagemBase64Atual}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                                <span style="font-size: 0.85rem; color: #333; font-weight: 600;">${file.name}</span>
                            </div>
                        `;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 1. Função para ligar os eventos de clique em EDITAR e EXCLUIR na tabela
    function ativarAcoesTabela() {
        // Evento de Editar
        document.querySelectorAll('.text-btn-editar').forEach(btn => {
            btn.onclick = function() {
                const tr = this.closest('tr');
                linhaEmEdicao = tr;

                // Extrair dados da linha
                const nome = tr.querySelector('.prod-nome')?.textContent.trim() || '';
                const desc = tr.querySelector('.prod-desc')?.textContent.trim() || '';
                const cat = tr.querySelector('.prod-cat')?.textContent.trim() || 'Tradicional';
                const peso = tr.querySelector('.prod-peso')?.textContent.trim() || '';
                const preco = tr.querySelector('.prod-preco')?.textContent.trim().replace('R$ ', '') || '';
                const statusText = tr.querySelector('.prod-status')?.textContent.trim() || 'Disponível';

                // Preencher o formulário à direita
                if (nomeInput) nomeInput.value = nome;
                if (descInput) descInput.value = desc;
                if (precoInput) precoInput.value = preco;
                if (pesoInput) pesoInput.value = peso;
                if (catSelect) catSelect.value = cat;
                if (ativoCheck) ativoCheck.checked = (statusText === 'Disponível');

                // Mudar o visual do painel para o modo de Edição
                if (formTitle) formTitle.textContent = 'Editar produto';
                if (formSubtitle) formSubtitle.textContent = 'Atualize os dados e salve as alterações.';
                if (btnSalvar) btnSalvar.textContent = 'Salvar alterações';
                if (btnCancelar) btnCancelar.style.display = 'block';

                // Destacar visualmente a linha selecionada
                document.querySelectorAll('tbody tr').forEach(row => row.style.background = 'transparent');
                tr.style.background = '#fff8f5';
            };
        });

        // Evento de Excluir (Abre o Modal)
        document.querySelectorAll('.text-btn-excluir').forEach(btn => {
            btn.onclick = function() {
                const tr = this.closest('tr');
                linhaParaExcluir = tr;

                // Extrair dados para mostrar no modal
                const nome = tr.querySelector('.prod-nome')?.textContent.trim() || 'Produto';
                const cat = tr.querySelector('.prod-cat')?.textContent.trim() || 'Categoria';
                const preco = tr.querySelector('.prod-preco')?.textContent.trim() || 'R$ 0,00';
                const desc = tr.querySelector('.prod-desc')?.textContent.trim() || '';

                if (modalProdNome) modalProdNome.textContent = `${nome} ${desc ? '· ' + desc : ''}`;
                if (modalProdInfo) modalProdInfo.textContent = `${cat} · ${preco}`;

                // Mostrar modal
                if (modalExcluir) modalExcluir.style.display = 'flex';
            };
        });
    }

    // Inicializar ações nos itens já existentes na página
    ativarAcoesTabela();

    // 2. Controlar o Fechamento do Modal de Exclusão
    function fecharModal() {
        if (modalExcluir) modalExcluir.style.display = 'none';
        linhaParaExcluir = null;
    }

    if (btnFecharModal) btnFecharModal.onclick = fecharModal;
    if (btnCancelarExclusao) btnCancelarExclusao.onclick = fecharModal;

    // Confirmar a exclusão efetiva da linha
    if (btnConfirmarExclusao) {
        btnConfirmarExclusao.onclick = function() {
            if (linhaParaExcluir) {
                linhaParaExcluir.remove();
                mostrarToast('Atenção', 'Produto excluído!', 'excluir');
                fecharModal();
            }
        };
    }

    // 3. Ação do Botão Salvar / Cadastrar
    if (btnSalvar) {
        btnSalvar.addEventListener('click', (e) => {
            e.preventDefault();

            const nome = nomeInput ? nomeInput.value.trim() : '';
            const desc = descInput ? descInput.value.trim() : '';
            const preco = precoInput ? precoInput.value.trim() : '';
            const peso = pesoInput ? pesoInput.value.trim() : '1 kg';
            const categoria = catSelect ? catSelect.value : 'Tradicional';
            const disponivel = ativoCheck ? ativoCheck.checked : true;

            // Validação de campos obrigatórios
            if (!nome || !preco) {
                mostrarToast('Atenção', 'Por favor, insira as informações necessárias.', 'excluir');
                if (nomeInput && !nome) nomeInput.focus();
                return;
            }

            const tabelaProdutos = document.querySelector('table tbody');
            if (!tabelaProdutos) return;

            const badgeClass = disponivel ? 'ready' : 'pending';
            const badgeText = disponivel ? 'Disponível' : 'Indisponível';

            if (linhaEmEdicao) {
                // MODO EDIÇÃO: Atualizar a linha existente
                linhaEmEdicao.querySelector('.prod-nome').textContent = nome;
                linhaEmEdicao.querySelector('.prod-desc').textContent = desc;
                linhaEmEdicao.querySelector('.prod-cat').textContent = categoria;
                linhaEmEdicao.querySelector('.prod-peso').textContent = peso.includes('kg') ? peso : `${peso} kg`;
                linhaEmEdicao.querySelector('.prod-preco').textContent = `R$ ${preco}`;
                
                const badge = linhaEmEdicao.querySelector('.prod-status');
                if (badge) {
                    badge.className = `badge ${badgeClass} prod-status`;
                    badge.textContent = badgeText;
                }

                linhaEmEdicao.style.background = 'transparent';
                mostrarToast('Sucesso', 'Produto atualizado!');
            } else {
                // MODO CADASTRO: Criar nova linha na tabela
                const novaLinha = document.createElement('tr');
                novaLinha.innerHTML = `
                    <td>
                        <strong class="prod-nome">${nome}</strong><br>
                        <small class="prod-desc">${desc}</small>
                    </td>
                    <td class="prod-cat">${categoria}</td>
                    <td class="prod-peso">${peso.includes('kg') ? peso : `${peso} kg`}</td>
                    <td class="prod-preco">R$ ${preco}</td>
                    <td><span class="badge ${badgeClass} prod-status">${badgeText}</span></td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="text-btn-editar" style="cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #ff5722;">Editar</span>
                            <span class="text-btn-excluir" style="cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #d32f2f;">Excluir</span>
                        </div>
                    </td>
                `;
                tabelaProdutos.prepend(novaLinha);
                ativarAcoesTabela(); // Reativar os cliques para o novo item
                mostrarToast('Sucesso', 'Produto cadastrado!');
            }

            // Resetar o formulário de volta ao estado padrão
            resetarFormulario();
        });
    }

    // 4. Ação do Botão Cancelar Edição
    if (btnCancelar) {
        btnCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            resetarFormulario();
        });
    }

    function resetarFormulario() {
        if (linhaEmEdicao) {
            linhaEmEdicao.style.background = 'transparent';
            linhaEmEdicao = null;
        }
        if (formTitle) formTitle.textContent = 'Novo produto';
        if (formSubtitle) formSubtitle.textContent = 'Cadastre um novo pacote no catálogo da loja.';
        if (btnSalvar) btnSalvar.textContent = '+ Cadastrar produto';
        if (btnCancelar) btnCancelar.style.display = 'none';

        if (nomeInput) nomeInput.value = '';
        if (descInput) descInput.value = '';
        if (precoInput) precoInput.value = '';
        if (pesoInput) pesoInput.value = '';
        if (catSelect) catSelect.value = 'Tradicional';
        if (ativoCheck) ativoCheck.checked = true;

        imagemBase64Atual = '';
        if (fotoInput) fotoInput.value = '';
        if (fotoPreviewContainer) {
            fotoPreviewContainer.innerHTML = `
                <span style="font-size: 0.85rem; color: #666;">🖼️ Clique para enviar uma foto<br><small>JPG ou PNG - até 5 MB</small></span>
            `;
        }
    }
});

// --- FUNÇÕES DA TELA DE PEDIDOS (Filtros e Dropdown de Período) ---

// Filtrar pedidos pelas abas de status
function filtrarPedidos(status, elementoBtn) {
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    elementoBtn.classList.add('active');

    const cards = document.querySelectorAll('.order-card');
    cards.forEach(card => {
        if (status === 'todos' || card.getAttribute('data-status') === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Abrir/fechar o menu dropdown de períodos
function toggleMenuPeriodo(event) {
    event.stopPropagation();
    const menu = document.getElementById('menu-periodo-opcoes');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Selecionar um período no menu
function selecionarPeriodo(periodo) {
    const textoSpan = document.getElementById('texto-periodo-selecionado');
    if (textoSpan) {
        textoSpan.textContent = `📅 ${periodo}`;
    }
    const menu = document.getElementById('menu-periodo-opcoes');
    if (menu) {
        menu.style.display = 'none';
    }
}

// Fechar o menu de períodos ao clicar fora dele
window.addEventListener('click', () => {
    const menu = document.getElementById('menu-periodo-opcoes');
    if (menu) {
        menu.style.display = 'none';
    }
});