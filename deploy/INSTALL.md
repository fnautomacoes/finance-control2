# Finance Control - Guia de Instalação VPS

## Pré-requisitos

- Docker instalado
- Docker Swarm ativo
- Rede `network_swarm_public` criada
- Traefik configurado com `letsencryptresolver`
- PostgreSQL acessível

## Instalação Rápida

### 1. Clone o repositório

```bash
git clone https://github.com/fnautomacoes/finance-control2.git
cd finance-control2/deploy
```

### 2. Execute o script de deploy

```bash
./deploy.sh
```

O script irá solicitar:

```
Domínio (ex: finance.meudominio.com.br): finance.fnautomacoes.com.br

Configuração do PostgreSQL:
  Host (ex: postgres): postgres
  Porta (ex: 5432): 5432
  Database (ex: financecontrol): financecontrol
  Usuário (ex: postgres): postgres
  Senha: ********

JWT Secret (deixe vazio para gerar automaticamente): [Enter]
Email do administrador (opcional): admin@exemplo.com
Versão da imagem Docker [latest]: [Enter]
```

### 3. Aguarde o deploy

O script irá:
1. ✓ Verificar pré-requisitos
2. ✓ Salvar configuração em `.env`
3. ✓ Construir imagem Docker
4. ✓ Deploy no Swarm
5. ✓ Verificar saúde do serviço

## Atualização (Zero-Downtime)

```bash
./redeploy.sh
```

### Opções do redeploy

| Flag | Descrição |
|------|-----------|
| `--rollback`, `-r` | Reverter para versão anterior |
| `--no-pull` | Não atualizar código do git |
| `--no-cleanup` | Não limpar imagens antigas |
| `--logs` | Mostrar logs após update |

### Exemplos

```bash
# Atualização normal
./redeploy.sh

# Atualização sem pull do git
./redeploy.sh --no-pull

# Reverter para versão anterior
./redeploy.sh --rollback
```

## Comandos Úteis

```bash
# Ver status dos serviços
docker service ls

# Ver logs do serviço
docker service logs -f finance-control_finance-control

# Ver tasks do serviço
docker service ps finance-control_finance-control

# Escalar replicas
docker service scale finance-control_finance-control=2

# Remover stack
docker stack rm finance-control
```

## Estrutura de Arquivos

```
deploy/
├── docker-compose.yml  # Stack definition
├── deploy.sh          # Script de instalação
├── redeploy.sh        # Script de atualização
├── .env               # Configuração (gerado pelo deploy.sh)
└── INSTALL.md         # Este arquivo
```

## Troubleshooting

### Serviço não inicia

```bash
# Ver logs
docker service logs finance-control_finance-control

# Ver tasks com erros
docker service ps --no-trunc finance-control_finance-control
```

### Erro de conexão com banco

Verifique se:
1. PostgreSQL está acessível na rede `network_swarm_public`
2. Credenciais estão corretas no `.env`
3. Database existe

```bash
# Testar conexão
docker run --rm --network network_swarm_public postgres:14 \
  psql "postgresql://USER:PASS@HOST:PORT/DB" -c "SELECT 1"
```

### Certificado SSL não funciona

Verifique se:
1. DNS do domínio aponta para o servidor
2. Traefik está configurado com `letsencryptresolver`
3. Porta 443 está aberta no firewall

### Rollback não funciona

```bash
# Forçar rollback manual
docker service update --rollback finance-control_finance-control

# Se ainda falhar, remova e redeploy
docker stack rm finance-control
./deploy.sh
```

## Backup

### Backup do banco de dados

```bash
docker exec -it POSTGRES_CONTAINER pg_dump -U postgres financecontrol > backup.sql
```

### Restaurar backup

```bash
docker exec -i POSTGRES_CONTAINER psql -U postgres financecontrol < backup.sql
```
