# Finance Control - REST API v1

## Visão Geral

API REST para integração com o Finance Control. Permite criar, listar, atualizar e excluir transações financeiras (receitas e despesas) programaticamente.

**Base URL:** `https://seu-dominio.com/api/v1`

## Autenticação

A API utiliza autenticação via **Bearer Token**. Todas as requisições (exceto criação de token) devem incluir o header:

```
Authorization: Bearer <seu_token>
```

### Criar Token de API

Para criar um token, você precisa estar autenticado via sessão web (cookie). Acesse o sistema web e faça uma requisição:

```http
POST /api/v1/tokens
Content-Type: application/json

{
  "name": "Meu App de Integração",
  "expiresInDays": 365
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Meu App de Integração",
    "token": "abc123...",
    "expiresAt": "2027-01-17T00:00:00.000Z",
    "createdAt": "2026-01-17T00:00:00.000Z"
  },
  "message": "Token criado com sucesso. Guarde-o em local seguro, pois não será exibido novamente."
}
```

> ⚠️ **IMPORTANTE:** O token só é exibido uma vez. Guarde-o em local seguro!

---

## Endpoints

### Transações

#### Criar Transação

Cria uma nova receita ou despesa.

```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `description` | string | Descrição da transação (1-255 caracteres) |
| `amount` | string/number | Valor da transação (ex: "150.00" ou 150) |
| `type` | string | Tipo: `"income"` (receita) ou `"expense"` (despesa) |
| `date` | string | Data no formato `YYYY-MM-DD` |
| `accountId` | number | ID da conta bancária |

**Campos Opcionais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `categoryId` | number | ID da categoria |
| `projectId` | number | ID do projeto |
| `contactId` | number | ID do contato |
| `status` | string | Status: `"pending"`, `"completed"` (padrão), `"cancelled"` |
| `notes` | string | Observações (até 1000 caracteres) |
| `attachments` | object | Anexos (JSON) |

**Exemplo - Criar Receita:**
```json
{
  "description": "Salário Janeiro",
  "amount": "5000.00",
  "type": "income",
  "date": "2026-01-15",
  "accountId": 1,
  "categoryId": 5,
  "notes": "Salário mensal"
}
```

**Exemplo - Criar Despesa:**
```json
{
  "description": "Supermercado",
  "amount": "350.75",
  "type": "expense",
  "date": "2026-01-17",
  "accountId": 1,
  "categoryId": 3
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "description": "Supermercado",
    "amount": "350.75",
    "type": "expense",
    "date": "2026-01-17",
    "status": "completed",
    "accountId": 1,
    "categoryId": 3,
    "projectId": null,
    "contactId": null,
    "notes": null,
    "createdAt": "2026-01-17T10:30:00.000Z"
  },
  "message": "Despesa criada com sucesso"
}
```

---

#### Listar Transações

Lista transações com filtros e paginação.

```http
GET /api/v1/transactions
Authorization: Bearer <token>
```

**Parâmetros de Query (todos opcionais):**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20, máx: 100) |
| `type` | string | Filtrar por tipo: `"income"` ou `"expense"` |
| `status` | string | Filtrar por status |
| `startDate` | string | Data inicial (YYYY-MM-DD) |
| `endDate` | string | Data final (YYYY-MM-DD) |
| `accountId` | number | Filtrar por conta |
| `categoryId` | number | Filtrar por categoria |

**Exemplo:**
```http
GET /api/v1/transactions?type=expense&startDate=2026-01-01&endDate=2026-01-31&limit=50
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "description": "Supermercado",
      "amount": "350.75",
      "type": "expense",
      "date": "2026-01-17",
      "status": "completed",
      "accountId": 1,
      "categoryId": 3,
      "createdAt": "2026-01-17T10:30:00.000Z",
      "updatedAt": "2026-01-17T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

---

#### Obter Transação por ID

```http
GET /api/v1/transactions/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "description": "Supermercado",
    "amount": "350.75",
    "type": "expense",
    "date": "2026-01-17",
    "status": "completed",
    "accountId": 1,
    "categoryId": 3,
    "projectId": null,
    "contactId": null,
    "notes": null,
    "attachments": null,
    "createdAt": "2026-01-17T10:30:00.000Z",
    "updatedAt": "2026-01-17T10:30:00.000Z"
  }
}
```

---

#### Atualizar Transação

```http
PUT /api/v1/transactions/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Corpo:** Qualquer campo da transação (todos opcionais)

```json
{
  "description": "Supermercado - Compra mensal",
  "amount": "380.00",
  "notes": "Atualizado com itens adicionais"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Transação atualizada com sucesso"
}
```

---

#### Excluir Transação

```http
DELETE /api/v1/transactions/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Transação excluída com sucesso"
}
```

> ⚠️ A exclusão reverte automaticamente o saldo da conta.

---

### Dados Auxiliares

#### Listar Contas

```http
GET /api/v1/accounts
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nubank",
      "type": "checking",
      "currency": "BRL",
      "balance": "1500.00"
    }
  ]
}
```

---

#### Listar Categorias

```http
GET /api/v1/categories
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Alimentação",
      "type": "expense",
      "color": "#ef4444",
      "icon": "utensils"
    },
    {
      "id": 5,
      "name": "Salário",
      "type": "income",
      "color": "#22c55e",
      "icon": "briefcase"
    }
  ]
}
```

---

### Gerenciamento de Tokens

#### Listar Tokens

```http
GET /api/v1/tokens
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Meu App",
      "lastUsedAt": "2026-01-17T10:30:00.000Z",
      "expiresAt": "2027-01-17T00:00:00.000Z",
      "isActive": true,
      "createdAt": "2026-01-17T00:00:00.000Z"
    }
  ]
}
```

---

#### Revogar Token

```http
DELETE /api/v1/tokens/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Token revogado com sucesso"
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token ausente, inválido ou expirado |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno |
| 503 | Service Unavailable - Banco de dados indisponível |

**Formato de Erro:**
```json
{
  "error": "Validation Error",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "amount",
      "message": "Valor é obrigatório"
    }
  ]
}
```

---

## Exemplos com cURL

### Criar Despesa
```bash
curl -X POST https://seu-dominio.com/api/v1/transactions \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Almoço",
    "amount": "35.00",
    "type": "expense",
    "date": "2026-01-17",
    "accountId": 1
  }'
```

### Criar Receita
```bash
curl -X POST https://seu-dominio.com/api/v1/transactions \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Freelance",
    "amount": "2000.00",
    "type": "income",
    "date": "2026-01-17",
    "accountId": 1,
    "categoryId": 5
  }'
```

### Listar Despesas do Mês
```bash
curl -X GET "https://seu-dominio.com/api/v1/transactions?type=expense&startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer seu_token_aqui"
```

---

## Rate Limiting

Atualmente não há limite de requisições implementado. Use com responsabilidade.

## Suporte

Em caso de dúvidas ou problemas, abra uma issue no repositório do projeto.
