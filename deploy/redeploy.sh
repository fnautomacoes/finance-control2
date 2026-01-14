#!/bin/bash

# ============================================
# Finance Control - Zero-Downtime Redeploy
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"
STACK_NAME="finance-control"
SERVICE_NAME="${STACK_NAME}_finance-control"

# Functions
print_header() {
    echo -e "\n${CYAN}============================================${NC}"
    echo -e "${CYAN}  Finance Control - Zero-Downtime Update${NC}"
    echo -e "${CYAN}============================================${NC}\n"
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

print_step() {
    echo -e "\n${CYAN}── $1 ──${NC}\n"
}

# Load environment
load_env() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Arquivo de configuração não encontrado: $ENV_FILE"
        print_info "Execute ./deploy.sh primeiro para configurar o ambiente."
        exit 1
    fi

    source "$ENV_FILE"
    print_success "Configuração carregada"
}

# Check current status
check_current_status() {
    print_step "Status Atual"

    local status=$(docker service ls --filter "name=$SERVICE_NAME" --format "{{.Name}}\t{{.Replicas}}\t{{.Image}}" 2>/dev/null)

    if [ -z "$status" ]; then
        print_error "Serviço não encontrado. Execute ./deploy.sh primeiro."
        exit 1
    fi

    echo -e "Serviço: ${GREEN}$status${NC}"

    # Get current image
    CURRENT_IMAGE=$(docker service inspect $SERVICE_NAME --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null | cut -d'@' -f1)
    echo -e "Imagem atual: ${YELLOW}$CURRENT_IMAGE${NC}"
}

# Pull latest code
pull_latest_code() {
    print_step "Atualizando Código"

    cd "$PROJECT_DIR"

    # Check if git repo
    if [ -d ".git" ]; then
        print_info "Baixando atualizações do repositório..."

        # Stash any local changes
        git stash 2>/dev/null || true

        # Pull latest
        git pull origin $(git branch --show-current) 2>/dev/null || {
            print_warning "Não foi possível atualizar via git. Continuando com código atual..."
        }

        print_success "Código atualizado"
    else
        print_warning "Não é um repositório git. Usando código atual."
    fi
}

# Build new image
build_new_image() {
    print_step "Construindo Nova Imagem"

    cd "$PROJECT_DIR"

    # Generate new version tag based on timestamp
    NEW_VERSION="${VERSION:-latest}-$(date +%Y%m%d%H%M%S)"

    print_info "Construindo imagem: finance-control:$NEW_VERSION"

    docker build -t finance-control:$NEW_VERSION -t finance-control:latest . 2>&1 | while read line; do
        echo -e "  ${BLUE}$line${NC}"
    done

    print_success "Imagem construída: finance-control:$NEW_VERSION"
}

# Update service with zero-downtime
update_service() {
    print_step "Atualizando Serviço (Zero-Downtime)"

    print_info "Iniciando rolling update..."
    print_info "Estratégia: start-first (novo container inicia antes do antigo parar)"

    # Export variables
    export DOMAIN DB_HOST DB_PORT DB_NAME DB_USER DB_PASS JWT_SECRET ADMIN_EMAIL
    export DOCKER_IMAGE="finance-control"
    export VERSION="$NEW_VERSION"

    # Update the service image
    docker service update \
        --image finance-control:$NEW_VERSION \
        --update-parallelism 1 \
        --update-delay 10s \
        --update-failure-action rollback \
        --update-order start-first \
        $SERVICE_NAME

    print_success "Serviço atualizado"
}

# Wait for healthy
wait_for_healthy() {
    print_step "Verificando Saúde do Serviço"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local status=$(docker service ls --filter "name=$SERVICE_NAME" --format "{{.Replicas}}" 2>/dev/null)
        local update_status=$(docker service inspect $SERVICE_NAME --format '{{.UpdateStatus.State}}' 2>/dev/null)

        echo -e "  Tentativa $attempt/$max_attempts - Replicas: $status - Update: $update_status"

        if [ "$status" = "1/1" ] && [ "$update_status" = "completed" ]; then
            print_success "Serviço está saudável!"
            return 0
        fi

        if [ "$update_status" = "rollback_completed" ]; then
            print_error "Update falhou e foi revertido!"
            return 1
        fi

        sleep 5
        attempt=$((attempt + 1))
    done

    print_warning "Timeout aguardando serviço"
    return 1
}

# Cleanup old images
cleanup_old_images() {
    print_step "Limpando Imagens Antigas"

    # Keep only last 3 images
    local images=$(docker images finance-control --format "{{.ID}}\t{{.Tag}}\t{{.CreatedAt}}" | sort -k3 -r | tail -n +4 | awk '{print $1}')

    if [ -n "$images" ]; then
        echo "$images" | xargs -r docker rmi 2>/dev/null || true
        print_success "Imagens antigas removidas"
    else
        print_info "Nenhuma imagem antiga para remover"
    fi
}

# Show logs
show_recent_logs() {
    print_step "Logs Recentes"

    docker service logs --tail 20 $SERVICE_NAME 2>/dev/null || true
}

# Show final status
show_final_status() {
    print_step "Status Final"

    local new_image=$(docker service inspect $SERVICE_NAME --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null | cut -d'@' -f1)

    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}  Atualização Concluída!${NC}"
    echo -e "${GREEN}============================================${NC}\n"

    echo -e "Imagem anterior: ${YELLOW}$CURRENT_IMAGE${NC}"
    echo -e "Imagem atual:    ${GREEN}$new_image${NC}"
    echo -e "URL:             ${BLUE}https://$DOMAIN${NC}"
    echo -e ""
    echo -e "Comandos úteis:"
    echo -e "  ${YELLOW}docker service logs -f $SERVICE_NAME${NC} - Ver logs"
    echo -e "  ${YELLOW}docker service ps $SERVICE_NAME${NC}       - Ver tasks"
    echo -e "  ${YELLOW}./redeploy.sh --rollback${NC}              - Reverter update"
}

# Rollback
rollback() {
    print_header
    print_warning "Iniciando rollback para versão anterior..."

    docker service update --rollback $SERVICE_NAME

    print_success "Rollback iniciado"

    wait_for_healthy
}

# Main
main() {
    print_header

    # Check for rollback flag
    if [ "$1" = "--rollback" ] || [ "$1" = "-r" ]; then
        load_env
        rollback
        exit 0
    fi

    # Check for help
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Uso: $0 [opções]"
        echo ""
        echo "Opções:"
        echo "  --rollback, -r    Reverter para versão anterior"
        echo "  --no-pull         Não atualizar código do git"
        echo "  --no-cleanup      Não limpar imagens antigas"
        echo "  --logs            Mostrar logs após update"
        echo "  --help, -h        Mostrar esta ajuda"
        exit 0
    fi

    load_env
    check_current_status

    # Parse flags
    NO_PULL=false
    NO_CLEANUP=false
    SHOW_LOGS=false

    for arg in "$@"; do
        case $arg in
            --no-pull) NO_PULL=true ;;
            --no-cleanup) NO_CLEANUP=true ;;
            --logs) SHOW_LOGS=true ;;
        esac
    done

    # Confirm
    echo ""
    read -p "$(echo -e ${YELLOW}"Deseja continuar com o update? (S/n): "${NC})" confirm
    if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
        print_warning "Update cancelado."
        exit 0
    fi

    # Execute steps
    if [ "$NO_PULL" = false ]; then
        pull_latest_code
    fi

    build_new_image
    update_service

    if wait_for_healthy; then
        if [ "$NO_CLEANUP" = false ]; then
            cleanup_old_images
        fi

        if [ "$SHOW_LOGS" = true ]; then
            show_recent_logs
        fi

        show_final_status
    else
        print_error "Update falhou! Verifique os logs."
        print_info "Para reverter: ./redeploy.sh --rollback"
        exit 1
    fi
}

# Run
main "$@"
