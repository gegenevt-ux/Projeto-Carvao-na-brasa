# Projeto Carvão na Brasa

## Frontend e API na Vercel

O frontend usa a API em `https://carvao-na-brasa-api.vercel.app`. A URL fica centralizada em `frontend/js/api.js`; atualize `API_BASE_URL` se o domínio da API mudar. As rotas são chamadas na raiz do domínio (`/produtos`, `/auth/login`, `/auth/cadastro` e `/pedidos`), sem o prefixo `/api`.

Para publicar:

1. Na Vercel do frontend, use `frontend` como diretório raiz e publique como site estático.
2. Na Vercel da API, use `backend` como diretório raiz.
3. Configure na API `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `JWT_SECRET` como variáveis de ambiente. Defina `FRONTEND_URL` com a origem exata do site publicado para restringir o CORS.
4. Publique a API e o frontend. O login usa token JWT; produtos, cadastro e pedidos são carregados e enviados à API. O carrinho continua salvo localmente.

Não coloque segredos no frontend nem no repositório. O endpoint de produtos pode ser conferido abrindo `https://carvao-na-brasa-api.vercel.app/produtos`.
