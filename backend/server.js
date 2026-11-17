const express = require('express');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');

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
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
app.use (async(req, res, next) => {
    try{
        await db.pronto;
        next();
    } catch (err) {
        console.error('Erro ao prepara o banco: ', err);
        resq.status(500).json({erro: 'Banco de dados indisponivel. '});
    }
});

app.use('/auth', authRoutes);
app.use('/produtos', require('./routes/produtos'));
app.use('/pedidos', pedidosRoutes);

// Endereço de teste: quando você abre o link da API, aparece essa frase.
// Se ela aparecer, a API está no ar.
app.get('/', (req, res) => {
    res.send('API do Projeto Carvão na Brasa rodando!');
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
