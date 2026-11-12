#!/usr/bin/env bash
# ==============================================================================
# Kadamba Designer Studio — Idempotent Azure Cloud Shell Deployment Script
# Provisions (or reuses existing resources in RESOURCE_GROUP):
#   1. Resource Group
#   2. Azure Storage Account + Public Blob Container (kadamba-media) + CORS
#   3. Azure App Service (Frontend Hosting, auto-detecting supported Node LTS)
#   4. Azure Container Registry (ACR)
#   5. Azure Linux Virtual Machine (Backend API + Nginx)
# ==============================================================================
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-kadamba-prod-rg}"
LOCATION="${LOCATION:-centralindia}"
SUFFIX="${SUFFIX:-$((1000 + RANDOM % 9000))}"
BLOB_CONTAINER="${BLOB_CONTAINER:-kadamba-media}"
APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-kadamba-app-plan}"
VM_NAME="${VM_NAME:-kadamba-api-vm}"
VM_SIZE="${VM_SIZE:-}"
VM_LOCATION="${VM_LOCATION:-$LOCATION}"
FRONTEND_CORS_ORIGINS="${FRONTEND_CORS_ORIGINS:-*}"

# 1. Verify Azure CLI session
if ! az account show --output none 2>/dev/null; then
  echo "[*] Logging into Azure..."
  az login
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo "[✓] Active Subscription: $SUBSCRIPTION_NAME"

# 2. Resource Group
echo ""
echo "[1/5] Ensuring Resource Group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# Reuse existing storage account / webapp / acr in the RG if already created
EXISTING_STORAGE=$(az storage account list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-${EXISTING_STORAGE:-kadambastore${SUFFIX}}}"

EXISTING_WEBAPP=$(az webapp list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
WEB_APP_NAME="${WEB_APP_NAME:-${EXISTING_WEBAPP:-kadamba-web-${SUFFIX}}}"

EXISTING_ACR=$(az acr list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
ACR_NAME="${ACR_NAME:-${EXISTING_ACR:-kadambaacr${SUFFIX}}}"

echo "=================================================================="
echo " Kadamba Designer Studio — Azure Infrastructure Provisioning"
echo "=================================================================="
echo " Resource Group : $RESOURCE_GROUP ($LOCATION)"
echo " Storage        : $STORAGE_ACCOUNT (container: $BLOB_CONTAINER)"
echo " Frontend App   : $WEB_APP_NAME.azurewebsites.net"
echo " ACR            : $ACR_NAME.azurecr.io"
echo " Backend VM     : $VM_NAME (${VM_SIZE:-auto-select} in $VM_LOCATION)"
echo "=================================================================="

# 3. Azure Storage Account + Blob Container + CORS
echo ""
echo "[2/5] Ensuring Azure Storage Account '$STORAGE_ACCOUNT' & Container '$BLOB_CONTAINER'..."
if ! az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az storage account create \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --allow-blob-public-access true \
    --min-tls-version TLS1_2 \
    --output table
else
  echo "[✓] Reusing existing Storage Account '$STORAGE_ACCOUNT'"
fi

STORAGE_KEY=$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query "[0].value" \
  --output tsv)

STORAGE_CONN=$(az storage account show-connection-string \
  --resource-group "$RESOURCE_GROUP" \
  --name "$STORAGE_ACCOUNT" \
  --query connectionString \
  --output tsv)

az storage container create \
  --name "$BLOB_CONTAINER" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" \
  --public-access blob \
  --output table

echo "[*] Configuring CORS rules on Blob service..."
az storage cors clear \
  --services b \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY" 2>/dev/null || true

az storage cors add \
  --services b \
  --methods GET HEAD OPTIONS \
  --origins "$FRONTEND_CORS_ORIGINS" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 86400 \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$STORAGE_KEY"

echo "[✓] Blob Storage ready: https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BLOB_CONTAINER}"

# 4. Azure App Service (Frontend)
echo ""
echo "[3/5] Provisioning Azure App Service for Frontend..."
if ! az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az appservice plan create \
    --name "$APP_SERVICE_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku B1 \
    --is-linux \
    --output table
else
  echo "[✓] Reusing existing App Service Plan '$APP_SERVICE_PLAN'"
fi

# Auto-detect supported Node LTS Linux runtime (NODE:20-lts / NODE:22-lts / NODE:24-lts)
NODE_RUNTIME=$(az webapp list-runtimes --os-type linux -o tsv 2>/dev/null | grep -E '^NODE:[0-9]+-lts$' | sort -V | tail -n 1 || true)
NODE_RUNTIME="${NODE_RUNTIME:-NODE:22-lts}"
echo "[*] Using Linux App Service runtime: $NODE_RUNTIME"

if ! az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az webapp create \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$APP_SERVICE_PLAN" \
    --runtime "$NODE_RUNTIME" \
    --output table
else
  echo "[✓] Reusing existing Web App '$WEB_APP_NAME'"
fi

az webapp config set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP_NAME" \
  --startup-file "npx --yes serve -s dist -l 8080" \
  --output none

echo "[✓] Frontend App URL: https://${WEB_APP_NAME}.azurewebsites.net"

# 5. Azure Container Registry (ACR)
echo ""
echo "[4/5] Ensuring Azure Container Registry '$ACR_NAME'..."
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az acr create \
    --name "$ACR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Basic \
    --admin-enabled true \
    --output table
else
  echo "[✓] Reusing existing ACR '$ACR_NAME'"
fi

# 6. Azure Linux Compute VM (Backend API)
echo ""
echo "[5/5] Ensuring Azure Linux VM '$VM_NAME' for Backend API..."
if ! az vm show --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --output none 2>/dev/null; then
  if [ -n "$VM_SIZE" ]; then
    CANDIDATE_SIZES=("$VM_SIZE")
  else
    CANDIDATE_SIZES=("Standard_B2s" "Standard_B1ms" "Standard_B2ats_v2" "Standard_D2s_v3" "Standard_D2as_v4" "Standard_D2s_v5" "Standard_B1s")
  fi

  VM_CREATED=false
  for candidate in "${CANDIDATE_SIZES[@]}"; do
    echo "[*] Trying VM size '$candidate' in '$VM_LOCATION'..."
    if az vm create \
      --resource-group "$RESOURCE_GROUP" \
      --name "$VM_NAME" \
      --location "$VM_LOCATION" \
      --image Ubuntu2204 \
      --size "$candidate" \
      --admin-username azureuser \
      --generate-ssh-keys \
      --public-ip-sku Standard \
      --output table; then
      VM_SIZE="$candidate"
      VM_CREATED=true
      break
    fi
    echo "[!] VM size '$candidate' unavailable in '$VM_LOCATION', trying next size..."
  done

  if [ "$VM_CREATED" != "true" ]; then
    echo "[!] Could not create VM in '$VM_LOCATION' with candidate sizes. Try: VM_LOCATION=southindia ./deploy-azure.sh"
    exit 1
  fi
else
  echo "[✓] Reusing existing VM '$VM_NAME'"
fi

echo "[*] Opening ports 80 (HTTP), 443 (HTTPS), and 4000 (API) on '$VM_NAME'..."
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 80 --priority 1001 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 443 --priority 1002 --output none
az vm open-port --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --port 4000 --priority 1003 --output none

VM_IP=$(az vm show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --show-details \
  --query publicIps \
  --output tsv)

ENV_OUT="kadamba-azure-env.txt"
cat > "$ENV_OUT" <<EOF
# Copy these into backend/.env (local test) or /etc/kadamba.env (production VM)
# DO NOT commit this file to git.

RESOURCE_GROUP="${RESOURCE_GROUP}"
WEB_APP_NAME="${WEB_APP_NAME}"
VM_NAME="${VM_NAME}"
VM_IP="${VM_IP}"
ACR_NAME="${ACR_NAME}"

FRONTEND_URL="https://${WEB_APP_NAME}.azurewebsites.net"
UPLOAD_STORAGE="azure"
AZURE_STORAGE_ACCOUNT="${STORAGE_ACCOUNT}"
AZURE_STORAGE_KEY="${STORAGE_KEY}"
AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONN}"
AZURE_STORAGE_CONTAINER="${BLOB_CONTAINER}"

# Frontend build variable (frontend/.env.production):
VITE_API_URL="http://${VM_IP}:4000/api"
VITE_SITE_URL="https://${WEB_APP_NAME}.azurewebsites.net"
EOF

echo ""
echo "=================================================================="
echo " PROVISIONING COMPLETE!"
echo "=================================================================="
echo " Frontend App   : https://${WEB_APP_NAME}.azurewebsites.net"
echo " Backend VM IP  : ${VM_IP} (SSH: ssh azureuser@${VM_IP})"
echo " Blob Container : https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BLOB_CONTAINER}"
echo " ACR Server     : ${ACR_NAME}.azurecr.io"
echo " Saved env vars : ${ENV_OUT} (keep private, do not commit)"
echo "=================================================================="
