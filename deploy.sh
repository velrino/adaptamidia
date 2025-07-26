#!/bin/bash

# Use strict mode
set -euo pipefail

PROJECT_ID="rare-tape-466414-f4"
INSTANCE_NAME="${INSTANCE_NAME:-api-vision}"
ZONE="${ZONE:-us-central1-a}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-micro}"
IMAGE_FAMILY="${IMAGE_FAMILY:-cos-stable}"
IMAGE_PROJECT="cos-cloud"


# Autenticar com o Google Cloud
echo "Autenticando com Google Cloud..."
gcloud auth activate-service-account --key-file=service-account.json
gcloud config set project $PROJECT_ID

# Função para lidar com erros
handle_error() {
    echo "ERRO: $1" >&2
    exit 1
}

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    handle_error "Docker não está instalado. Por favor, instale o Docker."
fi

# Verificar se o gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    handle_error "gcloud não está instalado. Por favor, instale o Google Cloud SDK."
fi

# Build da imagem Docker
echo "Fazendo build da imagem Docker..."
docker build -t gcr.io/$PROJECT_ID/api-vision:latest -f Dockerfile .
if [ $? -ne 0 ]; then
    handle_error "Falha ao construir a imagem Docker."
fi

# Push da imagem para Google Container Registry
echo "Fazendo push da imagem para GCR..."
gcloud auth configure-docker
docker push gcr.io/$PROJECT_ID/api-vision:latest
if [ $? -ne 0 ]; then
    handle_error "Falha ao enviar a imagem para o GCR."
fi

# Deletar instância existente se houver
echo "Removendo instância existente..."
gcloud compute instances delete "$INSTANCE_NAME" --zone="$ZONE" --quiet || true

# Criar instância no Compute Engine
gcloud compute instances create-with-container $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --container-image=gcr.io/$PROJECT_ID/api-vision:latest \
    --container-restart-policy=always \
    --tags=http-server,https-server \
    --boot-disk-size=20GB \
    --scopes=storage-ro
if [ $? -ne 0 ]; then
    handle_error "Falha ao criar a instância no Compute Engine."
fi

# Wait for instance to be running
echo "Aguardando a instância ficar rodando..."
for i in $(seq 1 10); do
  STATUS=$(gcloud compute instances describe "$INSTANCE_NAME" --zone="$ZONE" --format='get(status)')
  if [[ "$STATUS" == "RUNNING" ]]; then
    echo "Instância está rodando."
    break
  fi
  echo "Instância ainda não está rodando. Tentando novamente em 5 segundos..."
  sleep 5
done

# Aguardar alguns segundos para a instância iniciar
echo "Aguardando 15 segundos para a instância iniciar..."
sleep 15

# Obter IP externo da instância
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "Implantação concluída!"
echo "API disponível em: http://$EXTERNAL_IP:8000"
echo "Para testar: curl http://$EXTERNAL_IP:8000"

echo "Criando regra de firewall..."
if gcloud compute firewall-rules describe allow-fastapi --format="value(name)" --project="$PROJECT_ID" --quiet; then
  echo "Firewall rule allow-fastapi já existe. Skipping creation."
else
  echo "Criando regra de firewall allow-fastapi..."
  gcloud compute firewall-rules create allow-fastapi \
      --allow tcp:8000 \
      --source-ranges 0.0.0.0/0 \
      --target-tags http-server
fi



# Criar regra de firewall para permitir tráfego HTTP na porta 80
echo "Criando regra de firewall para HTTP (porta 80)..."
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server

# Criar regra de firewall para permitir tráfego HTTPS na porta 443
echo "Criando regra de firewall para HTTPS (porta 443)..."
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --target-tags https-server

# Remover imagem Docker local
docker rmi gcr.io/$PROJECT_ID/api-vision:latest

# Executar o container na instância
echo "Executando o container na instância..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="docker pull gcr.io/$PROJECT_ID/api-vision:latest && docker run -d -p 8000:8000 gcr.io/$PROJECT_ID/api-vision:latest"
if [ $? -ne 0 ]; then
    handle_error "Falha ao executar o container na instância."
fi

# Listar os containers rodando na instância (após a criação)
echo "Listando containers rodando na instância..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="docker ps"
if [ $? -ne 0 ]; then
    handle_error "Falha ao listar os containers rodando na instância."
fi


# Verificar se a instância está rodando
echo "Verificando se a instância está rodando..."
gcloud compute instances list --filter="name=$INSTANCE_NAME" --format="value(STATUS)"