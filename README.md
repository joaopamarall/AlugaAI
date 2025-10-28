# AlugaAI

Aplicação web desenvolvida com Nuxt 4 para apoiar o fluxo de aluguel de equipamentos. O projeto reúne uma landing page pública, um portal para clientes e um painel administrativo conectados ao Firebase (Authentication, Realtime Database e Storage). A proposta é permitir que uma pequena locadora mantenha o catálogo atualizado, registre locações e acompanhe dados operacionais em tempo real.

## Visão Geral

- Landing page (`app/pages/index.vue`) apresenta a solução, CTA para cadastro e animações de destaque.
- Autenticação (login com e-mail/senha ou Google) construída sobre Firebase Auth e gerenciada pelo plugin `app/plugins/firebase.client.ts`.
- Controle de acesso com middleware global (`app/middleware/auth.global.ts`) que restringe `/app` a clientes autenticados e `/admin` a e-mails listados em `NUXT_PUBLIC_ADMIN_EMAILS`.
- Portal do cliente (`/app/catalog`) lista itens disponíveis, permite reservar períodos e mostra locações ativas sincronizadas com o Realtime Database.
- Painel administrativo (`/admin/home`) oferece indicadores, lista locações ativas, itens em manutenção e atalhos para os formulários de cadastro de itens, clientes e locações.

## Tecnologias e bibliotecas

- [Nuxt 4](https://nuxt.com/) (Vue 3 + TypeScript) com diretório de origem em `app/`.
- Firebase (Auth, Realtime Database, Storage) para login, persistência e upload de imagens.
- Tailwind CLI instalado, mas o projeto utiliza principalmente CSS customizado (`app/assets/css/main.css`) para manter controle visual fino.
- Composables reativos (`app/composables`) para compartilhar estado de autenticação (`useFirebaseUser`) e perfil/role (`useUserProfile`).

## Fluxos principais da aplicação

### Landing page
- Estrutura hero com argumentos de venda, animações progressivas e cartões informativos.
- Navegação básica para `/login` e `/register`.

### Autenticação e registro
- **Login** (`app/pages/login/index.vue`) valida e-mail/senha, permite alternar visibilidade da senha e autentica via Firebase; também expõe o botão “Entrar com Google” usando `signInWithPopup`.
- **Cadastro** (`app/pages/register/index.vue`) cria contas por e-mail/senha, atualiza o `displayName`, chama `ensureUserProfile` para persistir o perfil em `users/{uid}` e aplica o mesmo padrão visual do login.
- Persistência pode ser alternada entre sessão e armazenamento local conforme a opção “Lembrar-me”.

### Portal do cliente (`/app/catalog`)
- Lista itens com status `available`, com filtro por nome/categoria e visualização de imagens hospedadas no Firebase Storage.
- Modal de reserva registra locações em `rentals/{id}` e muda o status do item para `rented`. Todos os campos são validados (datas, item selecionado e sessão válida).
- Bloco “Minhas locações” consulta o banco em tempo real (filtrado por `lesseeId`) para exibir contratos ativos.
- O botão “Sair” encerra a sessão no Firebase, reseta o perfil no estado global e redireciona para `/login`.

### Painel administrativo (`/admin/home`)
- Indicadores com a contagem de itens disponíveis, locações abertas e atrasos (retornos previstos antes do horário atual).
- Listas orientadas à operação: locações abertas ordenadas por data, itens em manutenção e links rápidos para os formulários de cadastro.
- Busca textual (campo `q`) pronta para evoluções de filtragem.
- Logout com o mesmo fluxo do portal do cliente, garantindo a limpeza de estado.

### Cadastros administrativos
- **Itens** (`/admin/items/form`): cria registros em `items/`, realiza upload opcional de imagem para o Storage, salva metadados (nome, categoria, status, descrição) e define timestamps `createdAt`/`updatedAt`.
- **Clientes** (`/admin/clients/form`): cadastra dados básicos em `clients/`, lista usuários autenticados (coleção `users`) e exibe clientes cadastrados manualmente.
- **Locações** (`/admin/reservations/open`): busca itens `available`, valida datas e salva contratos em `rentals/` com status `open`, alterando o status do item para `rented` em seguida.

## Integração com Firebase

- O plugin `app/plugins/firebase.client.ts` centraliza a inicialização usando `runtimeConfig.public` (variáveis `NUXT_PUBLIC_...`). Ele expõe `app`, `auth`, `database`, `storage`, `signInWithGoogle` e `signOutFirebase` via `nuxtApp.$firebase`.
- `app/composables/useFirebaseUser.ts` mantém `user` e `authReady` reativos compartilhados em toda a aplicação.
- `app/composables/useUserProfile.ts` resolve o papel do usuário (`admin` ou `client`). O método `ensureUserProfile` cria/atualiza o registro em `users/{uid}`, identifica administradores comparando o e-mail com `NUXT_PUBLIC_ADMIN_EMAILS` e atualiza `role`/`isAdmin` automaticamente.
- `app/middleware/auth.global.ts` aguarda `authReady`, força o carregamento do perfil e bloqueia rotas conforme o papel.

## Modelagem no Realtime Database

| Caminho                 | Campos relevantes                                                                 | Quando é escrito                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `users/{uid}`           | `role`, `isAdmin`, `email`, `displayName`, `createdAt`, `updatedAt`                | Após login/cadastro, via `ensureUserProfile`.                                                 |
| `items/{itemId}`        | `name`, `code`, `category`, `status`, `description`, `imageUrl`, timestamps       | Formulário de itens e atualizações automáticas ao abrir locações.                             |
| `rentals/{rentalId}`    | `itemId`, `itemName`, `lesseeId`, `startDate`, `expectedReturnDate`, `status`     | Reservas criadas por clientes ou administradores.                                            |
| `clients/{clientId}`    | `nome`, `email`, `telefone`, `documento`, `endereco`, `createdBy`, `createdAt`     | Cadastro manual de clientes no painel administrativo.                                        |

> **Importante:** Regras de segurança do Realtime Database e Storage devem ser configuradas diretamente no Firebase para respeitar os papéis `admin`/`client` planejados no front-end.

## Organização do código

- `app/pages/index.vue`: landing page pública com animações e copy principal.
- `app/pages/login/*.vue` e `app/pages/register/*.vue`: telas de autenticação.
- `app/pages/app/*.vue`: rotas do portal do cliente, com redirecionamento definido em `app/pages/app/index.vue`.
- `app/pages/admin/*.vue`: painel e formulários administrativos; `app/pages/admin/index.vue` redireciona para `home`.
- `app/composables/`: estados compartilhados (autenticação e perfil).
- `app/assets/css/main.css`: base de estilos utilizada globalmente (importada em `nuxt.config.ts`).
- `.env`: credenciais de desenvolvimento do Firebase (não versionar em produção). Crie um `.env.example` para compartilhar os nomes das variáveis.
- `nuxt.config.ts`: habilita módulo Tailwind, registra CSS global e expõe variáveis públicas.

## Pré-requisitos

- Node.js 18+ (recomendado manter a mesma versão usada no desenvolvimento local).
- Conta no Firebase com o projeto configurado e módulos Authentication, Realtime Database e Storage habilitados.
- Credenciais Web do Firebase configuradas nas variáveis de ambiente descritas abaixo.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID= # opcional
NUXT_PUBLIC_FIREBASE_DATABASE_URL=
NUXT_PUBLIC_ADMIN_EMAILS= # lista separada por vírgula (ex.: admin@empresa.com,outro@dominio.com)
```

> Em produção, mantenha os valores seguros e considere usar `.env.example` com placeholders para orientar outros colegas.

## Executando localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` conforme descrito acima.
3. Inicie o servidor em modo desenvolvimento (porta padrão `3000`):
   ```bash
   npm run dev
   ```
4. Para gerar build de produção:
   ```bash
   npm run build
   npm run preview
   ```

## Scripts disponíveis

| Script              | Descrição                                                     |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Executa o servidor Vite/Nuxt em modo desenvolvimento.         |
| `npm run build`     | Cria a build de produção (renderização híbrida/SSR).          |
| `npm run preview`   | Sobe pré-visualização da build de produção.                   |
| `npm run generate`  | Gera versão estática (quando necessário).                     |
| `npm run postinstall` | Executa `nuxt prepare` (script automatizado pelo Nuxt 4).   |

## Dicas para avaliação

- Teste o fluxo completo: cadastro → login → reserva de item → saída e novo login para garantir persistência.
- Configure ao menos um e-mail de administrador em `NUXT_PUBLIC_ADMIN_EMAILS` para acessar as rotas `/admin`.
- Verifique no Firebase Realtime Database se os registros são criados em `users`, `items`, `clients` e `rentals`, confirmando timestamps e estados (`status`).
- Itens adicionados com imagem ficam armazenados em `items/{itemId}/...` no Storage; confirme se as regras permitem leitura para usuários autenticados.

## Próximos passos sugeridos

- Ajustar regras de segurança do Firebase para refletir os papéis `admin`/`client` e proteger operações sensíveis.
- Criar Cloud Functions ou automações para atualizar status de itens ao encerrar locações e gerar alertas de atraso.
- Versionar um `.env.example` com placeholders e documentar as regras do Realtime Database/Storage no repositório.
- Adicionar testes e2e (ex.: Cypress ou Playwright) cobrindo fluxos críticos de autenticação, reserva e administração.
