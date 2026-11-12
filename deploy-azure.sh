#!/usr/bin/env bash
# ==============================================================================
# Kadamba Designer Studio — Automated Azure Cloud Shell Deployment Script
# Provisions:
#   1. Resource Group
#   2. Azure Storage Account + Public Blob Container (kadamba-media) + CORS
#   3. Azure App Service (Frontend Hosting)
#   4. Azure Container Registry (ACR)
#   5. Azure Linux Virtual Machine (Backend API + Nginx)
# ==============================================================================
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-kadamba-prod-rg}"
LOCATION="${LOCATION:-centralindia}"
SUFFIX="${SUFFIX:-$((1000 + RANDOM % 9000))}"

APP_SERVICE_PLAN="${APP_SERVICE_PLAN:-kadamba-app-plan}"
WEB_APP_NAME="${WEB_APP_NAME:-kadamba-web-${SUFFIX}}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-kadambastore${SUFFIX}}"
BLOB_CONTAINER="${BLOB_CONTAINER:-kadamba-media}"
ACR_NAME="${ACR_NAME:-kadambaacr${SUFFIX}}"
VM_NAME="${VM_NAME:-kadamba-api-vm}"
VM_SIZE="${VM_SIZE:-Standard_B1s}"
FRONTEND_CORS_ORIGINS="${FRONTEND_CORS_ORIGINS:-*}"

echo "=================================================================="
echo " Kadamba Designer Studio — Azure Infrastructure Provisioning"
echo "=================================================================="
echo " Resource Group : $RESOURCE_GROUP"
echo " Location       : $LOCATION"
echo " Storage        : $STORAGE_ACCOUNT (container: $BLOB_CONTAINER)"
echo " Frontend App   : $WEB_APP_NAME.azurewebsites.net"
echo " ACR            : $ACR_NAME.azurecr.io"
echo " Backend VM     : $VM_NAME ($VM_SIZE)"
echo "=================================================================="

# 1. Verify Azure CLI session (Azure Cloud Shell is pre-authenticated)
if ! az account show --output none 2>/dev/null; then
  echo "[*] Logging into Azure..."
  az login
fi

SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo "[✓] Active Subscription: $SUBSCRIPTION_NAME"

# 2. Resource Group
echo ""
echo "[1/5] Creating Resource Group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# 3. Azure Storage Account + Blob Container + CORS
echo ""
echo "[2/5] Creating Azure Storage Account '$STORAGE_ACCOUNT' & Blob Container '$BLOB_CONTAINER'..."
az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true \
  --min-tls-version TLS1_2 \
  --output table

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
  --account-key "$STORAGE_KEY" || true

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
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux \
  --output table

az webapp create \
  --name "$WEB_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE:20-lts" \
  --output table

az webapp config set \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP_NAME" \
  --startup-file "npx serve -s dist -l 8080" \
  --output none

echo "[✓] Frontend App URL: https://${WEB_APP_NAME}.azurewebsites.net"

# 5. Azure Container Registry (ACR)
echo ""
echo "[4/5] Creating Azure Container Registry '$ACR_NAME'..."
az acr create \
  --name "$ACR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Basic \
  --admin-enabled true \
  --output table

# 6. Azure Linux Compute VM (Backend API)
echo ""
echo "[5/5] Creating Azure Linux VM '$VM_NAME' for Backend API..."
az vm create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VM_NAME" \
  --location "$LOCATION" \
  --image Ubuntu2204 \
  --size "$VM_SIZE" \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --output table

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

FRONTEND_URL=https://${WEB_APP_NAME}.azurewebsites.net
UPLOAD_STORAGE=azure
AZURE_STORAGE_ACCOUNT=${STORAGE_ACCOUNT}
AZURE_STORAGE_KEY=${STORAGE_KEY}
AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONN}
AZURE_STORAGE_CONTAINER=${BLOB_CONTAINER}

# Frontend build variable (frontend/.env.production):
VITE_API_URL=http://${VM_IP}:4000/api
VITE_SITE_URL=https://${WEB_APP_NAME}.azurewebsites.net
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
echo ""
echo "Next steps:"
echo "  1. Copy the AZURE_STORAGE_* variables from ${ENV_OUT} into your backend .env."
echo "  2. Point your MongoDB Atlas allow-list to ${VM_IP}."
echo "  3. Bootstrap the VM following docs/AZURE_DEPLOYMENT.md."
