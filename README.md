# Finance Control

Sistema completo de controle financeiro pessoal com dashboard, transações, investimentos, metas e muito mais.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19, TypeScript, TailwindCSS 4, Radix UI |
| **Backend** | Node.js, Express, tRPC 11 |
| **Database** | PostgreSQL 14+ |
| **ORM** | Drizzle ORM |
| **Auth** | JWT + bcrypt |
| **Build** | Vite, esbuild |

## Funcionalidades

- **Dashboard** - Visão geral das finanças
- **Contas** - Gerenciamento de contas bancárias e carteiras
- **Transações** - Registro de receitas e despesas
- **Categorias** - Organização por categorias personalizadas
- **Investimentos** - Acompanhamento de ações, fundos, cripto
- **Metas** - Definição de objetivos financeiros
- **Contas a Pagar/Receber** - Controle de vencimentos
- **Contatos** - Cadastro de pessoas e empresas
- **Projetos** - Alocação de custos por projeto
- **Patrimônio** - Ativos e passivos

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- pnpm 10+

## Instalação Local

### 1. Clone o repositório

```bash
git clone https://github.com/fnautomacoes/finance-control2.git
cd finance-control2
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure o banco de dados

```bash
# Crie o banco de dados PostgreSQL
psql -U postgres -c "CREATE DATABASE financecontrol;"

# Execute o schema
psql -U postgres -d financecontrol -f db.sql
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/financecontrol

# Auth (gere uma chave segura com: openssl rand -base64 32)
JWT_SECRET=sua-chave-secreta-com-pelo-menos-32-caracteres

# Admin (opcional)
ADMIN_EMAIL=admin@exemplo.com
```

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse: http://localhost:3000

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm check` | Verifica tipos TypeScript |
| `pnpm test` | Executa testes |
| `pnpm format` | Formata código com Prettier |

## Deploy com Docker

### Build da imagem

```bash
docker build -t finance-control:latest .
```

### Docker Compose (desenvolvimento)

```bash
docker-compose up -d
```

### Docker Swarm (produção)

```bash
# Configure as variáveis
export DATABASE_URL="postgresql://postgres:senha@postgres:5432/financecontrol"
export JWT_SECRET="sua-chave-secreta-32-chars"
export DOMAIN="finance.seudominio.com"

# Deploy
docker stack deploy -c docker-stack.yml finance-control
```

## Estrutura do Projeto

```
finance-control2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/            # Utilitários (tRPC client)
│   │   └── _core/          # Hooks e contextos
│   └── public/             # Assets estáticos
├── server/                 # Backend Express
│   ├── _core/              # Core do servidor
│   │   ├── index.ts        # Entry point
│   │   ├── sdk.ts          # Serviço de autenticação
│   │   ├── oauth.ts        # Rotas de login/registro
│   │   ├── context.ts      # Contexto tRPC
│   │   └── trpc.ts         # Configuração tRPC
│   ├── routers.ts          # Rotas da API
│   └── db.ts               # Funções do banco de dados
├── drizzle/                # Schema do banco
│   └── schema.ts           # Definição das tabelas
├── shared/                 # Código compartilhado
├── db.sql                  # Script SQL do banco
├── Dockerfile              # Build Docker
├── docker-stack.yml        # Deploy Swarm
└── .env.example            # Template de variáveis
```

## API

### Autenticação

```bash
# Registrar novo usuário
POST /api/auth/register
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}

# Login
POST /api/auth/login
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### tRPC Endpoints

Todos os endpoints tRPC estão em `/api/trpc`:

| Router | Endpoints |
|--------|-----------|
| `auth` | `me`, `logout` |
| `accounts` | `list`, `create`, `update`, `delete` |
| `categories` | `list`, `create`, `update`, `delete` |
| `transactions` | `list`, `create`, `update`, `delete` |
| `investments` | `list`, `create`, `update`, `delete` |
| `goals` | `list`, `create`, `update`, `delete` |
| `contacts` | `list`, `create`, `update`, `delete` |
| `payables` | `list`, `create`, `update`, `delete` |
| `receivables` | `list`, `create`, `update`, `delete` |
| `assets` | `list`, `create`, `update`, `delete` |
| `liabilities` | `list`, `create`, `update`, `delete` |
| `dashboard` | `summary` |

## Banco de Dados

### Diagrama ER (simplificado)

```
users ─────────────────────────────────────────────┐
  │                                                │
  ├── categories                                   │
  │     └── transactions ◄─── accounts ◄───────────┤
  │                                                │
  ├── investments ◄─── accounts                    │
  │                                                │
  ├── goals                                        │
  │                                                │
  ├── contacts                                     │
  │     ├── payables                               │
  │     └── receivables                            │
  │                                                │
  ├── projects                                     │
  │                                                │
  ├── assets                                       │
  │                                                │
  ├── liabilities                                  │
  │                                                │
  └── netWorthHistory                              │
```

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários e autenticação |
| `categories` | Categorias de receitas/despesas |
| `accounts` | Contas bancárias e carteiras |
| `transactions` | Movimentações financeiras |
| `investments` | Investimentos |
| `goals` | Metas financeiras |
| `costCenters` | Centros de custo |
| `projects` | Projetos |
| `contacts` | Contatos (pessoas/empresas) |
| `payables` | Contas a pagar |
| `receivables` | Contas a receber |
| `assets` | Ativos |
| `liabilities` | Passivos |
| `marketIndices` | Índices de mercado |
| `netWorthHistory` | Histórico de patrimônio |

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão PostgreSQL |
| `JWT_SECRET` | Sim | Chave secreta para tokens JWT (min 32 chars) |
| `PORT` | Não | Porta do servidor (default: 3000) |
| `NODE_ENV` | Não | Ambiente (development/production) |
| `ADMIN_EMAIL` | Não | Email do usuário administrador |
| `FORGE_API_URL` | Não | URL da API externa (LLM, storage) |
| `FORGE_API_KEY` | Não | Chave da API externa |

## Segurança

- Senhas criptografadas com **bcrypt** (10 rounds)
- Sessões via **JWT** com expiração de 1 ano
- Cookies **httpOnly**, **secure**, **sameSite=none**
- Isolamento de dados por usuário (userId em todas as tabelas)

## Licença

MIT
