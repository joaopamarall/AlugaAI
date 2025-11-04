# AlugaAI

Aplicação Nuxt 4 que digitaliza o ciclo de aluguel de equipamentos de uma locadora: divulga a vitrine pública, oferece um portal para clientes e concentra a operação administrativa. O backend é baseado em Firebase Authentication e Realtime Database, garantindo sincronização em tempo real e um fluxo de login simplificado.

## Sumário

- [Visão geral](#visão-geral)
- [Principais funcionalidades](#principais-funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Comandos úteis](#comandos-úteis)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelagem no Realtime Database](#modelagem-no-realtime-database)
- [Detalhes dos fluxos](#detalhes-dos-fluxos)
- [Boas práticas e próximos passos](#boas-práticas-e-próximos-passos)

## Visão geral

- **Stack:** Nuxt 4 (Vue 3 + TypeScript) com estrutura em `app/`, Tailwind (via CLI/Vite) e Firebase (Auth, Realtime Database e Storage para ativos opcionais).
- **Objetivo:** permitir que uma pequena locadora mantenha o catálogo atualizado, controle locações, cadastre clientes e acompanhe indicadores em tempo real.
- **Camadas:** landing page pública, portal autenticado para clientes (`/app`) e painel administrativo (`/admin`) restrito a usuários com e-mail autorizado.

## Principais funcionalidades

### Página pública
- Hero com proposta de valor, argumentos comerciais e CTAs para criação de conta ou login.
- Layout responsivo com temas e animações leves definidos em `app/assets/css/main.css`.

### Autenticação
- Login por e-mail/senha ou Google (`/login`).
- Registro com confirmação de senha (`/register`) que já cria o perfil em `users/{uid}` via `ensureUserProfile`.
- Persistência de sessão (Firebase Auth) controlada pelo plugin `app/plugins/firebase.client.ts`.

### Portal do cliente (`/app/catalog`)
- Lista itens com status `available`, buscando dados em `items/`.
- Reservas com seleção de período, persistindo contratos em `rentals/` e atualizando o status do item para `rented`.
- Bloco “Minhas locações” consulta contratos filtrados por `lesseeId`.
- Logout encerra a sessão no Firebase e limpa o estado reativo.

### Painel administrativo
- Topo com avatar/atalho para edição do próprio perfil em `/admin/profile`.
- Página inicial (`/admin/home`) exibe KPIs (itens disponíveis, locações ativas, atrasos), tabelas operacionais e links rápidos.
- Formulários dedicados:
  - **Clientes** (`/admin/clients/form`): registra novos usuários (inclui criação no Firebase Auth) e lista clientes sincronizados da coleção `users`.
  - **Itens** (`/admin/items/form`): cadastra equipamentos sem upload de imagem (campos texto e status). Possui importador em lote que aceita um array JSON com campos `imageUrl` opcionais.
  - **Locações** (`/admin/reservations/open`): cria contratos, valida datas e altera status do item.
- Gerenciamento de sessão com mesma ação de logout do portal.

## Pré-requisitos

- **Node.js** ≥ 20.x (recomendado LTS mais recente).
- **npm** ≥ 10.x (instalado junto com o Node).
- Uma conta Firebase com:
  - Authentication habilitado (Email/Password e Google opcional).
  - Realtime Database no modo seguro (regra de leitura/escrita ajustada ao projeto).
  - Storage opcional para hospedar imagens referenciadas via `imageUrl`.

## Configuração do ambiente

1. **Clonar o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd alugaAI-projeto/AlugaAI
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**

   Crie um arquivo `.env` (ou configure no ambiente de deploy) com as variáveis abaixo:

   ```env
   NUXT_PUBLIC_FIREBASE_API_KEY=
   NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NUXT_PUBLIC_FIREBASE_PROJECT_ID=
   NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NUXT_PUBLIC_FIREBASE_APP_ID=
   NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
   NUXT_PUBLIC_FIREBASE_DATABASE_URL=
   NUXT_PUBLIC_ADMIN_EMAILS=admin@empresa.com,outro-admin@empresa.com
   ```

   > As credenciais públicas são lidas em `nuxt.config.ts` e injetadas via `nuxtApp.$firebase`.

4. **Rodar o projeto em modo desenvolvimento**
   ```bash
   npm run dev
   ```
   O Nuxt exibirá no terminal a URL local (por padrão `http://localhost:3000`). A aplicação é atualizada automaticamente a cada alteração.

## Comandos úteis

| Comando            | Descrição                                        |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Inicia o servidor de desenvolvimento (hot reload). |
| `npm run build`    | Gera a build de produção.                        |
| `npm run preview`  | Sobe a build de produção localmente.             |
| `npm run generate` | Gera saída estática (SSG) quando aplicável.      |

## Estrutura de pastas

```
app/
├─ assets/             # CSS global (main.css) e assets estáticos
├─ composables/        # Hooks reativos (auth, perfil)
├─ middleware/         # Middleware global de proteção de rotas
├─ pages/              # Rotas públicas, /app e /admin
│  ├─ admin/           # Home, formulários, profile
│  ├─ app/             # Portal do cliente (catalog)
│  ├─ login/, register # Fluxos de autenticação
│  └─ index.vue        # Landing page
├─ plugins/            # Inicialização do Firebase (cliente)
└─ app.vue             # Shell base do Nuxt
```

## Modelagem no Realtime Database

| Caminho            | Conteúdo                                                                                                  | Quem grava                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `users/{uid}`      | Perfil do usuário (nome, e-mail, função, telefone, documento, endereço, timestamps).                      | `ensureUserProfile`, tela de perfil admin. |
| `items/{id}`       | Equipamentos (nome, código, categoria, status, descrição, `imageUrl` opcional, timestamps).               | Formulário `/admin/items/form` e importador. |
| `clients/{id}`     | Cadastros manuais de clientes (nome, e-mail, documento, telefone, endereço, timestamps, autor).          | `/admin/clients/form`.                     |
| `rentals/{id}`     | Locações (item referenciado, locatário, datas, status).                                                   | `/admin/reservations/open` e portal cliente. |
| `reservations/`    | Entradas auxiliares para reservas abertas (utilizadas na home admin).                                    | Painel administrativo.                     |

> Itens importados via JSON podem definir `imageUrl` apontando para um arquivo público (local ou Storage). O formulário manual não realiza upload.

## Detalhes dos fluxos

- **Middleware de acesso:** `app/middleware/auth.global.ts` aguarda o estado do Firebase Auth, garante o carregamento do perfil e bloqueia `/admin` para usuários sem o papel `admin` listado em `NUXT_PUBLIC_ADMIN_EMAILS`.
- **Perfil administrativo:** `/admin/profile` permite ao usuário editar nome, documento, telefone e endereço. Também sincroniza o `displayName` no Firebase Auth.
- **Cadastro de itens:** formulário simples sem upload. O importador permitir inserir vários itens de uma vez colando um array JSON. Campos suportados: `name`, `code`, `category`, `status` (`available`/`rented`/`maintenance`), `description`, `imageUrl` (opcional).
- **Cadastro de clientes:** ao salvar um cliente manualmente, o sistema cria uma conta na Auth com senha provisória e já grava o registro em `users/{uid}` com o papel `client`.
- **Reserva de itens (portal cliente):** valida datas, atualiza o status do item e mantém lista de locações em tempo real para o usuário logado.

## Boas práticas e próximos passos

- **Regras de segurança:** ajuste o Realtime Database e Storage para permitir leitura/escrita apenas para usuários autenticados conforme papel.
- **Uploads de imagem:** atualmente o upload manual foi desativado; caso volte a ser necessário, reabilite o fluxo no formulário de itens e garanta limites de tamanho/formato no Storage.
- **CI/CD:** considere adicionar lint/teste automatizado antes do deploy.
- **Observabilidade:** logs importantes já usam `console.error`. Avalie integrar com uma solução de monitoramento em produção.

---
Feito com Nuxt, Firebase e bastante tempo de CSS artesanal. 🚀
