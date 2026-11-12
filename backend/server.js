const express = require('express');
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');

// Aqui nasce a nossa API. A linha de baixo ensina ela a entender
// os dados que chegam em formato JSON (é assim que o site manda os pedidos).
const app = express();
app.use(express.json());

// O site e a API moram em endereços diferentes na Vercel.
// Por segurança, o navegador bloqueia essa conversa, a não ser que a API diga "pode vir".
// Avisa o navegador que o site tem permissão de falar com a gente.
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use('/auth', authRoutes);

// A taxa de entrega fica guardada aqui, do nosso lado.
// Se ela viesse do site, qualquer pessoa esperta poderia mudar o valor e pagar menos.
// Também limitamos cada item a 20 pacotes, pra ninguém pedir 9999 sem querer.
const TAXA_ENTREGA = 8.0;
const MAX_QUANTIDADE = 20;

// Agora a gente decide onde fica o banco.
// Na Vercel, existem as variáveis do Turso, então usamos o banco que está na nuvem.
const usandoTurso = Boolean(process.env.TURSO_DATABASE_URL);
const arquivoLocal = path.resolve(__dirname, '../banco/banco.db');

const db = createClient(usandoTurso
    ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: 'file:' + arquivoLocal });


// lemos o criar_banco.sql e montamos todas as tabelas sozinhos.
// No Turso isso não é preciso, porque lá o banco já foi criado.
const bancoPronto = (async () => {
    if (usandoTurso) return;
    const tabela = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'produto'");
    if (tabela.rows.length === 0) {
        const sql = fs.readFileSync(path.resolve(__dirname, '../banco/criar_banco.sql'), 'utf8');
        await db.executeMultiple(sql);
        console.log('Banco local criado a partir de criar_banco.sql');
    }
})();

// Dois atalhos pra não repetir código toda hora:
// "consultar" busca várias linhas no banco, e "umaLinha" pega só a primeira.
// Os dois esperam o banco ficar pronto antes de perguntar qualquer coisa.
const consultar = async (sql, args = []) => { await bancoPronto; return (await db.execute({ sql, args })).rows; };
const umaLinha = async (sql, args = []) => (await consultar(sql, args))[0];

// Imagina duas pessoas fazendo pedido no mesmo segundo.
// Se as duas gravassem ao mesmo tempo, uma poderia atrapalhar a outra.
// Então a gente organiza uma fila: cada pedido espera o anterior terminar de ser salvo.
// E tem mais: ou o pedido é salvo inteiro (pedido + itens), ou não é salvo nada.
// Se der erro no meio, a gente desfaz tudo (rollback), pra não ficar pedido pela metade.
let fila = Promise.resolve();
function emTransacao(trabalho) {
    const vez = fila.then(async () => {
        await bancoPronto;
        const tx = await db.transaction('write');
        try {
            const resultado = await trabalho(tx);
            await tx.commit();
            return resultado;
        } catch (err) {
            await tx.rollback().catch(() => {});
            throw err;
        } finally {
            tx.close();
        }
    });
    fila = vez.catch(() => {});   // se um pedido der erro, a fila continua andando normalmente
    return vez;
}

// Conta com dinheiro no computador às vezes dá 49.99999999.
// Essa função arredonda pros centavos, pra ficar 50.00 certinho.
const centavos = (valor) => Math.round(valor * 100) / 100;

// Endereço de teste: quando você abre o link da API, aparece essa frase.
// Se ela aparecer, a API está no ar.
app.get('/', (req, res) => {
    res.send('API do Projeto Carvão na Brasa rodando!');
});

// Quando a loja pede a lista de produtos, a gente busca no banco e devolve todos.
app.get('/produtos', async (req, res) => {
    try {
        res.json(await consultar('SELECT * FROM produto ORDER BY id'));
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ erro: 'Não foi possível buscar os produtos.' });
    }
});

// Aqui é onde o pedido do cliente chega.
// Antes de salvar qualquer coisa, a gente confere tudo com calma.
app.post('/pedidos', async (req, res) => {
    const { cliente_id, recebimento, endereco_entrega, bairro, observacao, itens } = req.body || {};

    // Primeiro, conferimos se veio tudo o que precisa:
    // quem é o cliente, se é entrega ou retirada, e quais produtos ele quer.
    if (!Number.isInteger(cliente_id)) {
        return res.status(400).json({ erro: 'Informe o cliente do pedido.' });
    }
    if (!['entrega', 'retirada'].includes(recebimento)) {
        return res.status(400).json({ erro: 'O recebimento deve ser "entrega" ou "retirada".' });
    }

    // Se for entrega, não dá pra levar sem saber o endereço e o bairro.
    const entrega = recebimento === 'entrega';
    if (entrega && (!String(endereco_entrega || '').trim() || !String(bairro || '').trim())) {
        return res.status(400).json({ erro: 'Endereço e bairro são obrigatórios para pedidos do tipo entrega.' });
    }

    // Um pedido sem nenhum item não faz sentido.
    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ erro: 'O pedido precisa ter pelo menos um item.' });
    }

    // Cada item precisa dizer qual produto é e quantos pacotes.
    // Quantidade negativa, zero ou um texto como "abc" não passam.
    for (const item of itens) {
        if (!Number.isInteger(item.produto_id) || !Number.isInteger(item.quantidade)
            || item.quantidade < 1 || item.quantidade > MAX_QUANTIDADE) {
            return res.status(400).json({ erro: `Cada item precisa de um produto e uma quantidade de 1 a ${MAX_QUANTIDADE}.` });
        }
    }

    // Se o cliente colocou o mesmo produto duas vezes no carrinho,
    // a gente junta numa linha só. Ex.: 1 + 1 pacote de 3 kg vira 2 pacotes de 3 kg.
    const quantidades = new Map();
    for (const item of itens) {
        quantidades.set(item.produto_id, (quantidades.get(item.produto_id) || 0) + item.quantidade);
    }
    const produtoIds = [...quantidades.keys()];

    try {
        // Esse cliente existe mesmo? Se não existir, nem continuamos.
        const cliente = await umaLinha('SELECT id FROM cliente WHERE id = ?', [cliente_id]);
        if (!cliente) return res.status(400).json({ erro: 'Cliente não encontrado.' });

        // Agora buscamos os produtos no banco, mas só os que estão disponíveis.
        // O preço vem SEMPRE do banco, nunca do site. Assim ninguém consegue mudar o preço no navegador.
        const marcadores = produtoIds.map(() => '?').join(',');
        const produtos = await consultar(
            `SELECT id, nome, preco FROM produto WHERE disponivel = 1 AND id IN (${marcadores})`, produtoIds);

        // Se algum produto pedido não voltou da busca, é porque não existe ou está em falta.
        if (produtos.length !== produtoIds.length) {
            return res.status(400).json({ erro: 'Um ou mais produtos não existem ou estão indisponíveis.' });
        }

        // Hora da conta: para cada produto, preço × quantidade.
        // Somamos tudo, colocamos a taxa (só se for entrega) e chegamos no total.
        const itensComPreco = produtos.map(p => ({
            produto_id: Number(p.id),
            nome: p.nome,
            quantidade: quantidades.get(Number(p.id)),
            preco_unitario: Number(p.preco)
        }));
        const subtotal = centavos(itensComPreco.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0));
        const taxa = entrega ? TAXA_ENTREGA : 0;
        const total = centavos(subtotal + taxa);

        // Tudo conferido! Agora salvamos o pedido e, logo em seguida, cada item dele.
        // Isso acontece dentro da "fila" lá de cima: ou salva tudo junto, ou não salva nada.
        const pedidoId = await emTransacao(async (tx) => {
            const pedido = await tx.execute({
                sql: `INSERT INTO pedido (cliente_id, recebimento, endereco_entrega, bairro, taxa_entrega, observacao, total, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                args: [cliente_id, recebimento,
                       entrega ? endereco_entrega.trim() : null,
                       entrega ? bairro.trim() : null,
                       taxa, String(observacao || '').trim().slice(0, 200) || null, total]
            });

            // O banco acabou de dar um número pro pedido. Usamos esse número pra ligar cada item a ele.
            const id = Number(pedido.lastInsertRowid);
            for (const item of itensComPreco) {
                await tx.execute({
                    sql: 'INSERT INTO item_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                    args: [id, item.produto_id, item.quantidade, item.preco_unitario]
                });
            }
            return id;
        });

        // Se deu certo, respondemos pro site com o número do pedido e os valores,
        // pra ele mostrar a tela de "Pedido enviado".
        return res.status(201).json({
            mensagem: 'Pedido criado com sucesso!',
            pedido_id: pedidoId,
            subtotal,
            taxa_entrega: taxa,
            total,
            itens: itensComPreco
        });
    } catch (err) {
        // Se algo inesperado acontecer, anotamos o erro pra gente ver depois
        // e mandamos uma mensagem simples pro cliente tentar de novo.
        console.error('Erro ao criar pedido:', err);
        return res.status(500).json({ erro: 'Não foi possível criar o pedido. Tente de novo.' });
    }
});

// Aqui o painel do Pedro pede a lista de pedidos.
// Buscamos todos os pedidos (do mais novo pro mais antigo), junto com o nome e o WhatsApp do cliente.
app.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await consultar(`
            SELECT p.*, c.nome AS cliente_nome, c.whatsapp AS cliente_whatsapp
            FROM pedido p
            JOIN cliente c ON p.cliente_id = c.id
            ORDER BY p.data DESC, p.id DESC
        `);

        // Depois pegamos os itens de todos os pedidos, com o nome e o peso de cada produto...
        const itens = await consultar(`
            SELECT i.pedido_id, i.produto_id, i.quantidade, i.preco_unitario, pr.nome, pr.peso
            FROM item_pedido i
            JOIN produto pr ON pr.id = i.produto_id
        `);

        // ...e colocamos cada item dentro do pedido certo, pro Pedro ver o que separar.
        res.json(pedidos.map(p => ({ ...p, itens: itens.filter(i => i.pedido_id === p.id) })));
    } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
        res.status(500).json({ erro: 'Não foi possível buscar os pedidos.' });
    }
});

// Por último, ligamos a API.
// No computador, quando vocês rodam "npm start", ela fica escutando na porta 3000.
// Na Vercel é diferente: a própria Vercel liga a API quando alguém acessa,
// por isso a gente só "entrega" o app pra ela no final (module.exports).
const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀 (banco: ${usandoTurso ? 'Turso' : 'arquivo local'})`));
}

module.exports = app;
