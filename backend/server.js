const express = require('express');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API do Projeto Carvão na Brasa rodando!');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
