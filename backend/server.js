const express = require('express');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');

// Aqui nasce a nossa API. A linha de baixo ensina ela a entender
// os dados que chegam em formato JSON (é assim que o site manda os pedidos).
const app = express();
app.disable('x-powered-by');   // não conta para ninguém que a API usa Express
app.set('trust proxy', true);  // na Vercel, pega o IP certo de quem acessa (usado no limite de login)
app.use(express.json());

// O site e a API moram em endereços diferentes na Vercel.
// Por segurança, o navegador bloqueia essa conversa, a não ser que a API diga "pode vir".
// Avisa o navegador que o site tem permissão de falar com a gente.
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
app.use (async(req, res, next) => {
    try{
        await db.pronto;
        next();
    } catch (err) {
        console.error('Erro ao preparar o banco: ', err);
        res.status(500).json({erro: 'Banco de dados indisponivel. '});
    }
});

app.use('/auth', authRoutes);
app.use('/produtos', require('./routes/produtos'));
app.use('/pedidos', pedidosRoutes);

app.use('/comercio', require('./routes/comercio'));  //Dados da loja

// Endereço de teste: quando você abre o link da API, aparece essa frase.
// Se ela aparecer, a API está no ar.
app.get('/', (req, res) => {
    res.send('API do Projeto Carvão na Brasa rodando!');
});


// Rota que não existe: responde em JSON, igual ao resto da API
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Qualquer outro erro (por exemplo, JSON quebrado no corpo do pedido)
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'Os dados enviados não estão em JSON válido.' });
    }
    console.error(err);
    res.status(err.status || 500).json({ erro: 'Erro inesperado na API.' });
});
// Por último, ligamos a API.
// No computador, quando vocês rodam "npm start", ela fica escutando na porta 3000.
// Na Vercel é diferente: a própria Vercel liga a API quando alguém acessa,
// por isso a gente só "entrega" o app pra ela no final (module.exports).
const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} 🚀 (banco: ${process.env.TURSO_DATABASE_URL ? 'Turso' : 'arquivo local'})`));
}

module.exports = app;
