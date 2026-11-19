const express = require('express');
const db = require('../config/db');
const { soComerciante } = require( '../middlewares/auth');

const router = express.Router();

// razao_social e documento (CNPJ ou CPF) são exigidos pelo Decreto 7.962/2013 para quem vende pela internet.
const CAMPOS = ['nome_comercio', 'endereco', 'telefone', 'horario', 'razao_social', 'documento', 'atendimento'];
// Como a loja atende: entrega e retirada (ambos), só entrega ou só retirada
const ATENDIMENTOS = ['ambos', 'entrega', 'retirada'];
const COLUNAS = CAMPOS.join(', ');

// Confere os dígitos verificadores do CPF (11 números) ou do CNPJ (14 números)
function documentoValido(numeros) {
  if (!/^\d+$/.test(numeros) || /^(\d)\1+$/.test(numeros)) return false;
  const digito = (base, pesos) => {
    const soma = base.split('').reduce((total, n, i) => total + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  if (numeros.length === 11) {
    const d1 = digito(numeros.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = digito(numeros.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return numeros.endsWith(`${d1}${d2}`);
  }
  if (numeros.length === 14) {
    const d1 = digito(numeros.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = digito(numeros.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return numeros.endsWith(`${d1}${d2}`);
  }
  return false;
}
// Guarda sempre no formato de leitura: 000.000.000-00 ou 00.000.000/0000-00
function formatarDocumento(numeros) {
  return numeros.length === 11
    ? numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// GET /comercio: mostra os dados da loja (qualquer pessoa pode ver)
router.get('/', async (req, res) => {
  try {
    const busca = await db.execute(
      `SELECT ${COLUNAS} FROM comerciante ORDER BY id LIMIT 1`
    );
    if (busca.rows.length === 0) {
      return res.status(404).json({ erro: 'Dados da loja ainda não cadastrados.' });
    }
    res.json(busca.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar dados da loja:', err);
    res.status(500).json({ erro: 'Não foi possível buscar os dados da loja.' });
  }
});

// PUT /comercio: o Pedro atualiza os dados da loja
// Só muda o que foi enviado; o resto continua como estava.
router.put('/', soComerciante, async (req, res) => {
  try {
    const busca = await db.execute({
      sql: `SELECT ${COLUNAS} FROM comerciante WHERE id = ?`,
      args: [req.usuario.id],
    });
    if (busca.rows.length === 0) {
      return res.status(404).json({ erro: 'Comerciante não encontrado.' });
    }

    const atual = busca.rows[0];
    const novo = {};
    for (const campo of CAMPOS) {
      const valor = (req.body || {})[campo];
      if (valor === undefined) {
        novo[campo] = atual[campo];
      } else if (typeof valor !== 'string' || valor.trim().length > 200) {
        return res.status(400).json({ erro: `O campo ${campo} precisa ser um texto de até 200 letras.` });
      } else {
        novo[campo] = valor.trim() || null;
      }
    }
       novo.atendimento = novo.atendimento || 'ambos';
    if (!ATENDIMENTOS.includes(novo.atendimento)) {
      return res.status(400).json({ erro: 'Escolha como a loja atende: ambos, entrega ou retirada.' });
    }
    if (novo.documento) {
      const numeros = novo.documento.replace(/\D/g, '');
      if (!documentoValido(numeros)) {
        return res.status(400).json({ erro: 'CNPJ ou CPF inválido. Confira os números.' });
      }
      novo.documento = formatarDocumento(numeros);
    }
    await db.execute({
      sql: `UPDATE comerciante SET ${CAMPOS.map(c => `${c} = ?`).join(', ')} WHERE id = ?`,
      args: [...CAMPOS.map(c => novo[c]), req.usuario.id],
    });

    res.json({ mensagem: 'Dados da loja atualizados!', ...novo });
  } catch (err) {
    console.error('Erro ao atualizar dados da loja:', err);
    res.status(500).json({ erro: 'Não foi possível atualizar os dados da loja.' });
  }
});

module.exports = router;
