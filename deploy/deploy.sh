#!/bin/bash

# ============================================
# Finance Control - Deploy Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"
STACK_NAME="finance-control"

# Functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}  Finance Control - Deploy${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Generate random JWT secret
generate_jwt_secret() {
    openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
}

# Prompt for input with default value
prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_password="$4"

    if [ "$is_password" = "true" ]; then
        echo -n -e "${YELLOW}$prompt${NC}"
        read -s value
        echo ""
    else
        if [ -n "$default" ]; then
            echo -n -e "${YELLOW}$prompt [${default}]: ${NC}"
        else
            echo -n -e "${YELLOW}$prompt: ${NC}"
        fi
        read value
    fi

    if [ -z "$value" ]; then
        value="$default"
    fi

    eval "$var_name=\"$value\""
}

# Check prerequisites
check_prerequisites() {
    print_info "Verificando pré-requisitos..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker não encontrado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    print_success "Docker instalado"

    # Check Docker Swarm
    if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
        print_warning "Docker Swarm não está ativo. Inicializando..."
        docker swarm init 2>/dev/null || true
    fi
    print_success "Docker Swarm ativo"

    # Check network
    if ! docker network ls | grep -q "network_swarm_public"; then
        print_warning "Rede network_swarm_public não existe. Criando..."
        docker network create --driver overlay --attachable network_swarm_public
    fi
    print_success "Rede network_swarm_public disponível"
}

# Collect configuration
collect_config() {
    echo -e "\n${BLUE}── Configuração do Domínio ──${NC}\n"
    prompt_input "Domínio (ex: finance.meudominio.com.br)" "" "DOMAIN"

    if [ -z "$DOMAIN" ]; then
        print_error "Domínio é obrigatório!"
        exit 1
    fi

    echo -e "\n${BLUE}── Configuração do PostgreSQL ──${NC}\n"
    prompt_input "Host" "postgres" "DB_HOST"
    prompt_input "Porta" "5432" "DB_PORT"
    prompt_input "Database" "financecontrol" "DB_NAME"
    prompt_input "Usuário" "postgres" "DB_USER"
    prompt_input "Senha" "" "DB_PASS" "true"

    if [ -z "$DB_PASS" ]; then
        print_error "Senha do banco de dados é obrigatória!"
        exit 1
    fi

    echo -e "\n${BLUE}── Configuração da Aplicação ──${NC}\n"

    local default_jwt=$(generate_jwt_secret)
    prompt_input "JWT Secret (deixe vazio para gerar automaticamente)" "$default_jwt" "JWT_SECRET"

    prompt_input "Email do administrador (opcional)" "" "ADMIN_EMAIL"

    prompt_input "Versão da imagem Docker" "latest" "VERSION"
}

# Save environment file
save_env_file() {
    print_info "Salvando configuração em $ENV_FILE..."

    cat > "$ENV_FILE" << EOF
# Finance Control - Environment Configuration
# Generated on $(date)

# Domain
DOMAIN=$DOMAIN

# PostgreSQL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS

# Application
JWT_SECRET=$JWT_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL

# Docker
DOCKER_IMAGE=finance-control
VERSION=$VERSION
EOF

    chmod 600 "$ENV_FILE"
    print_success "Configuração salva"
}

# Build Docker image
build_image() {
    print_info "Construindo imagem Docker..."

    cd "$PROJECT_DIR"
    docker build -t finance-control:$VERSION .

    print_success "Imagem construída: finance-control:$VERSION"
}

# Deploy stack
deploy_stack() {
    print_info "Fazendo deploy da stack..."

    cd "$SCRIPT_DIR"

    # Export variables for docker-compose
    export DOMAIN DB_HOST DB_PORT DB_NAME DB_USER DB_PASS JWT_SECRET ADMIN_EMAIL VERSION
    export DOCKER_IMAGE="finance-control"

    # Deploy
    docker stack deploy -c docker-compose.yml $STACK_NAME

    print_success "Stack deployed: $STACK_NAME"
}

# Wait for service to be healthy
wait_for_healthy() {
    print_info "Aguardando serviço ficar saudável..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local status=$(docker service ls --filter "name=${STACK_NAME}_finance-control" --format "{{.Replicas}}" 2>/dev/null)

        if [ "$status" = "1/1" ]; then
            print_success "Serviço está saudável!"
            return 0
        fi

        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo ""
    print_warning "Timeout aguardando serviço. Verifique os logs com: docker service logs ${STACK_NAME}_finance-control"
    return 1
}

# Show final info
show_final_info() {
    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deploy Concluído!${NC}"
    echo -e "${GREEN}============================================${NC}\n"

    echo -e "URL: ${BLUE}https://$DOMAIN${NC}"
    echo -e ""
    echo -e "Comandos úteis:"
    echo -e "  ${YELLOW}docker service ls${NC}                    - Listar serviços"
    echo -e "  ${YELLOW}docker service logs -f ${STACK_NAME}_finance-control${NC} - Ver logs"
    echo -e "  ${YELLOW}./redeploy.sh${NC}                        - Atualizar (zero-downtime)"
    echo -e ""
    echo -e "Arquivos:"
    echo -e "  ${YELLOW}$ENV_FILE${NC}    - Configuração"
    echo -e "  ${YELLOW}$SCRIPT_DIR/docker-compose.yml${NC} - Stack"
}

# Main
main() {
    print_header

    check_prerequisites

    # Check if already configured
    if [ -f "$ENV_FILE" ]; then
        print_warning "Configuração existente encontrada em $ENV_FILE"
        prompt_input "Deseja reconfigurar? (s/N)" "N" "RECONFIG"

        if [ "$RECONFIG" != "s" ] && [ "$RECONFIG" != "S" ]; then
            print_info "Usando configuração existente..."
            source "$ENV_FILE"
        else
            collect_config
            save_env_file
        fi
    else
        collect_config
        save_env_file
    fi

    # Confirm before deploying
    echo -e "\n${BLUE}── Resumo da Configuração ──${NC}\n"
    echo -e "Domínio:    ${GREEN}$DOMAIN${NC}"
    echo -e "Database:   ${GREEN}$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME${NC}"
    echo -e "Versão:     ${GREEN}$VERSION${NC}"
    echo -e ""

    prompt_input "Confirma o deploy? (S/n)" "S" "CONFIRM"

    if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
        print_warning "Deploy cancelado."
        exit 0
    fi

    build_image
    deploy_stack
    wait_for_healthy
    show_final_info
}

# Run
main "$@"
