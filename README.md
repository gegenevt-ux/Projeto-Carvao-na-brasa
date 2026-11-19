# Projeto Carvão na Brasa

Loja online do Carvão do Pedro, um comércio de carvão vegetal em Porto Velho (RO).

Pelo site, o cliente escolhe o carvão, faz o pedido para entrega ou retirada e acompanha o andamento.
O Pedro usa um painel próprio para receber os pedidos, mudar o status, cadastrar produtos e atualizar
os dados da loja.

Trabalho da disciplina Projeto de Extensão II, 2026.

- Site: https://carvao-na-brasa-frontend.vercel.app
- API: https://carvao-na-brasa-api.vercel.app

## Funcionalidades

Cliente:

- catálogo, página de cada produto e carrinho
- cadastro e login (a sessão dura 2 horas)
- pedido para entrega ou retirada, com observação
- pagamento com Pix pelo site, ou dinheiro (com troco) e cartão na entrega ou na retirada
- código de 4 números para confirmar a entrega ou a retirada
- comprovante do pedido para imprimir ou salvar em PDF
- acompanhamento em "Meus pedidos", com cancelamento enquanto o pedido está pendente
- páginas de Política de Privacidade e de Trocas e cancelamento

> O Pix é uma demonstração: o QR code e o código copia e cola não cobram nada. O botão "Já paguei" só marca o pedido como pago.

Comerciante (Pedro):

- resumo das vendas do mês
- pedidos: confirmar, preparar, marcar como pronto, cancelar e concluir (pedindo o código ao cliente)
- produtos: cadastrar, editar, pausar e excluir
- dados da loja: endereço, telefone, horário, razão social e CNPJ ou CPF, que aparecem no site todo

O site foi testado com o axe (WCAG 2 AA), funciona pelo teclado e no celular, e respeita a opção
de reduzir animações do sistema.

## Estrutura

```
frontend/   site (HTML, CSS e JavaScript)
backend/    API (Node.js e Express)
banco/      criar_banco.sql, o script que cria as tabelas
```

O site e a API ficam em projetos separados na Vercel. O site chama a API pela internet,
e a API guarda os dados no Turso (SQLite na nuvem).

```
Site (Vercel)  ->  API (Vercel)  ->  Banco (Turso)
```

O endereço da API fica em `frontend/js/api.js`, na constante `API_BASE_URL`.

## Tecnologias

- HTML, CSS e JavaScript no site
- Node.js e Express na API
- SQLite / Turso (libSQL) no banco
- bcrypt para as senhas e JWT para o login
- Vercel para publicar

Segurança: validação dos dados do cadastro, limite de 5 tentativas de login, proteção contra
código malicioso (XSS) e erros da API sempre em JSON.

## Rotas da API

As rotas com (login) precisam do token no cabeçalho `Authorization: Bearer <token>`.

Login e cadastro

| Método | Rota | Quem usa | O que faz |
|---|---|---|---|
| POST | `/auth/cadastro` | cliente | cria a conta |
| POST | `/auth/login` | cliente e Pedro | entra e recebe o token |

Produtos

| Método | Rota | Quem usa | O que faz |
|---|---|---|---|
| GET | `/produtos` | todos | lista os produtos (`?disponivel=1`, `?categoria=`) |
| GET | `/produtos/:id` | todos | mostra um produto |
| POST | `/produtos` (login) | Pedro | cadastra |
| PUT | `/produtos/:id` (login) | Pedro | edita |
| PATCH | `/produtos/:id/disponibilidade` (login) | Pedro | pausa ou volta a vender |
| DELETE | `/produtos/:id` (login) | Pedro | exclui, se nunca foi vendido |

Pedidos

| Método | Rota | Quem usa | O que faz |
|---|---|---|---|
| POST | `/pedidos` (login) | cliente | faz um pedido (`forma_pagamento`: `pix`, `dinheiro` ou `cartao`) |
| GET | `/pedidos/meus` (login) | cliente | lista os próprios pedidos |
| PATCH | `/pedidos/:id/cancelar` (login) | cliente | cancela, se estiver pendente |
| PATCH | `/pedidos/:id/pagar` (login) | cliente | marca o Pix como pago (demonstração) |
| GET | `/pedidos` (login) | Pedro | lista todos os pedidos (`?status=`) |
| GET | `/pedidos/:id` (login) | cliente e Pedro | mostra um pedido |
| PATCH | `/pedidos/:id/status` (login) | Pedro | muda o status; para concluir, envia o `codigo` |

Status: `pendente`, `preparando`, `pronto`, `concluido` ou `cancelado`.
O código de entrega só vai para o cliente. A API não mostra o código ao Pedro.

Dados da loja

| Método | Rota | Quem usa | O que faz |
|---|---|---|---|
| GET | `/comercio` | todos | nome, endereço, telefone, horário, razão social e documento |
| PUT | `/comercio` (login) | Pedro | atualiza os dados da loja |

## Rodar no computador

Precisa do [Node.js](https://nodejs.org).

```bash
cd backend
npm install
npm start
```

A API abre em `http://localhost:3000`. Na primeira vez, o arquivo `banco/banco.db` é criado a partir
do `banco/criar_banco.sql`. Para o site usar a API local, troque o `API_BASE_URL` em `frontend/js/api.js`.

Para criar a conta do comerciante (depois de rodar a API pelo menos uma vez):

```bash
node scripts/criar-comerciante.js "Nome" "email" "senha" "Nome do comércio"
```

## Publicação

1. Projeto do site na Vercel: pasta raiz `frontend`, como site estático.
2. Projeto da API na Vercel: pasta raiz `backend`.
3. Variáveis de ambiente da API: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET` e
   `FRONTEND_URL` (o endereço do site, sem barra no final).

O arquivo `.env` com essas chaves não vai para o GitHub.

## Equipe

| Integrante | O que fez |
|---|---|
| Getúlio Neves Tavares | coordenação, banco de dados, publicação na Vercel e no Turso, rota de dados da loja |
| Kamylla Rodrigues da Silva | front-end |
| Kemily Freitas dos Santos | front-end |
| Luccas Matheus Silva de Miranda | cadastro e login |
| Iran Gabriel Sampaio Bezerra | rotas de produtos |
| Luciano Blanco Rodrigues | rotas de pedidos |
| Manoel Rubens Ramos Maciel Filho | área do comerciante |
| Maria Eduarda Paiva Mendonça | protótipo das telas no Figma |
| Yasmim Síria N de Almeida Pereira | Relatorio/Documentação |
| Maria Eduarda Mendes | testes e demonstrações |
