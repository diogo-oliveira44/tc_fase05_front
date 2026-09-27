# Resolve Aí — Front-end

Front do project de gestão de ocorrências do projeto [`tc_fase05`](../tc_fase05).

## Funcionalidades

**Solicitante**

- Criar conta e entrar (o access token é renovado automaticamente com o refresh token).
- Registrar ocorrências com categoria, endereço, coordenadas (inclusive pela geolocalização do navegador) e até 5 imagens.
- Listar as próprias ocorrências com filtros por status, prioridade, categoria e período, ordenação e paginação.
- Ver detalhes, histórico de alterações, comentar, enviar imagens e avaliar ocorrências resolvidas.
- Rever a própria avaliação depois de enviada.

**Gestor** (conta criada pelo seed da API: `MANAGER_EMAIL` / `MANAGER_PASSWORD`)

- Listar todas as ocorrências, com filtro "atribuídas a mim".
- Mudar o status: analisar, iniciar atendimento, concluir (com solução) e cancelar (com motivo).
- Alterar a prioridade e escolher o responsável em uma lista de gestores, com justificativa.
- Painel com totais por status, prioridade e categoria, ocorrências em atraso (SLA por prioridade), tempo médio de resolução e avaliações, filtrável por período.

## Executar

Suba a API antes (em `../tc_fase05`, `docker compose up`); ela fica na porta `3000`.

### Localmente

```bash
bun install
bun dev
```

Acesse http://localhost:3001.

### Com Docker

```bash
docker compose up
```

O container acessa a API pela porta publicada no host (`host.docker.internal:3000`).

### Variáveis de ambiente

| Variável  | Padrão                  | Descrição                            |
| --------- | ----------------------- | ------------------------------------ |
| `API_URL` | `http://localhost:3000` | Endereço da API para o proxy `/api`. |
| `PORT`    | `3001`                  | Porta do servidor do front-end.      |

### Validar

```bash
bun run typecheck
bun run build
```

## Estrutura

```
src/
  index.ts          servidor Bun: serve o app e faz proxy de /api/* para API_URL
  App.tsx           rotas (router próprio em router.tsx, sem dependências extras)
  api/              cliente HTTP (tokens, refresh, erros), tipos e endpoints
  auth/             contexto de autenticação
  pages/            login, cadastro, lista, nova ocorrência, detalhe e painel
  components/       layout, componentes base e seções da página de ocorrência
  lib/              formatação, rótulos em pt-BR, hooks e utilitários de imagem
```

O navegador chama sempre a mesma origem (`/api/v1/...`) e o servidor Bun repassa para a API, o que
mantém o app livre de preflight de CORS. Chamar a API direto de outra origem também funciona: ela
libera `PATCH` e o header `X-File-Name` para o domínio configurado em `CORS_ORIGIN`.

## Imagem de produção

```bash
docker build -t resolveai-front .
docker run -p 3001:3001 -e API_URL=https://<api> resolveai-front
```
