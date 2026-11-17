const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Faça login para continuar.' });
  }
}

const exigirTipo = (tipo, mensagem) => (req, res, next) =>
  autenticar(req, res, () => {
    if (req.usuario.tipo !== tipo) return res.status(403).json({ erro: mensagem });
    next();
  });

const soComerciante = exigirTipo('comerciante', 'Só o comerciante pode fazer isso.');
const soCliente = exigirTipo('cliente', 'Só clientes podem fazer isso.');

module.exports = { autenticar, soComerciante, soCliente };