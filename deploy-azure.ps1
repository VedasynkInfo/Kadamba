# ==============================================================================
# Kadamba Designer Studio — Automated Azure Deployment Script (PowerShell)
# Provisions:
#   1. Resource Group
#   2. Azure Storage Account + Public Blob Container (kadamba-media) + CORS
#   3. Azure App Service (Frontend Hosting)
#   4. Azure Container Registry (ACR)
#   5. Azure Linux Virtual Machine (Backend API + Nginx)
# ==============================================================================
$ErrorActionPreference = "Stop"

$Suffix = Get-Random -Minimum 1000 -Maximum 9999
$ResourceGroup = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } else { "kadamba-prod-rg" }
$Location = if ($env:LOCATION) { $env:LOCATION } else { "centralindia" }
$AppServicePlan = if ($env:APP_SERVICE_PLAN) { $env:APP_SERVICE_PLAN } else { "kadamba-app-plan" }
$WebAppName = if ($env:WEB_APP_NAME) { $env:WEB_APP_NAME } else { "kadamba-web-$Suffix" }
$StorageAccount = if ($env:STORAGE_ACCOUNT) { $env:STORAGE_ACCOUNT } else { "kadambastore$Suffix" }
$BlobContainer = if ($env:BLOB_CONTAINER) { $env:BLOB_CONTAINER } else { "kadamba-media" }
$AcrName = if ($env:ACR_NAME) { $env:ACR_NAME } else { "kadambaacr$Suffix" }
$VmName = if ($env:VM_NAME) { $env:VM_NAME } else { "kadamba-api-vm" }
$VmSize = if ($env:VM_SIZE) { $env:VM_SIZE } else { "Standard_B1s" }
$CorsOrigins = if ($env:FRONTEND_CORS_ORIGINS) { $env:FRONTEND_CORS_ORIGINS } else { "*" }

Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Kadamba Designer Studio — Azure Infrastructure Provisioning" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Resource Group : $ResourceGroup ($Location)"
Write-Host " Storage        : $StorageAccount (container: $BlobContainer)"
Write-Host " Frontend App   : $WebAppName.azurewebsites.net"
Write-Host " ACR            : $AcrName.azurecr.io"
Write-Host " Backend VM     : $VmName ($VmSize)"
Write-Host "=================================================================="

# 1. Login check
az account show --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[*] Logging into Azure..." -ForegroundColor Yellow
    az login
}

# 2. Resource Group
Write-Host "`n[1/5] Creating Resource Group '$ResourceGroup'..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output table

# 3. Azure Storage Account + Blob Container + CORS
Write-Host "`n[2/5] Creating Storage Account '$StorageAccount' & Container '$BlobContainer'..." -ForegroundColor Cyan
az storage account create `
  --name $StorageAccount `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Standard_LRS `
  --kind StorageV2 `
  --allow-blob-public-access true `
  --min-tls-version TLS1_2 `
  --output table

$StorageKey = (az storage account keys list `
  --resource-group $ResourceGroup `
  --account-name $StorageAccount `
  --query "[0].value" `
  --output tsv)

$StorageConn = (az storage account show-connection-string `
  --resource-group $ResourceGroup `
  --name $StorageAccount `
  --query connectionString `
  --output tsv)

az storage container create `
  --name $BlobContainer `
  --account-name $StorageAccount `
  --account-key $StorageKey `
  --public-access blob `
  --output table

Write-Host "[*] Configuring CORS rules on Blob service..." -ForegroundColor Yellow
az storage cors clear --services b --account-name $StorageAccount --account-key $StorageKey 2>$null
az storage cors add `
  --services b `
  --methods GET HEAD OPTIONS `
  --origins $CorsOrigins `
  --allowed-headers "*" `
  --exposed-headers "*" `
  --max-age 86400 `
  --account-name $StorageAccount `
  --account-key $StorageKey

Write-Host "[OK] Blob Storage ready: https://$StorageAccount.blob.core.windows.net/$BlobContainer" -ForegroundColor Green

# 4. Azure App Service (Frontend)
Write-Host "`n[3/5] Provisioning Azure App Service for Frontend..." -ForegroundColor Cyan
az appservice plan create `
  --name $AppServicePlan `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku B1 `
  --is-linux `
  --output table

az webapp create `
  --name $WebAppName `
  --resource-group $ResourceGroup `
  --plan $AppServicePlan `
  --runtime "NODE:20-lts" `
  --output table

az webapp config set `
  --resource-group $ResourceGroup `
  --name $WebAppName `
  --startup-file "npx --yes serve -s dist -l 8080" `
  --output none

# 5. Azure Container Registry (ACR)
Write-Host "`n[4/5] Creating Azure Container Registry '$AcrName'..." -ForegroundColor Cyan
az acr create `
  --name $AcrName `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Basic `
  --admin-enabled true `
  --output table

# 6. Azure Linux Compute VM (Backend API)
Write-Host "`n[5/5] Creating Azure Linux VM '$VmName'..." -ForegroundColor Cyan
az vm create `
  --resource-group $ResourceGroup `
  --name $VmName `
  --location $Location `
  --image Ubuntu2204 `
  --size $VmSize `
  --admin-username azureuser `
  --generate-ssh-keys `
  --public-ip-sku Standard `
  --output table

Write-Host "[*] Opening ports 80, 443, and 4000 on '$VmName'..." -ForegroundColor Yellow
az vm open-port --resource-group $ResourceGroup --name $VmName --port 80 --priority 1001 --output none
az vm open-port --resource-group $ResourceGroup --name $VmName --port 443 --priority 1002 --output none
az vm open-port --resource-group $ResourceGroup --name $VmName --port 4000 --priority 1003 --output none

$VmIp = (az vm show --resource-group $ResourceGroup --name $VmName --show-details --query publicIps --output tsv)

$EnvOut = "kadamba-azure-env.txt"
@"
# Copy these into backend/.env (local test) or /etc/kadamba.env (production VM)
# DO NOT commit this file to git.

FRONTEND_URL=https://$WebAppName.azurewebsites.net
UPLOAD_STORAGE=azure
AZURE_STORAGE_ACCOUNT=$StorageAccount
AZURE_STORAGE_KEY=$StorageKey
AZURE_STORAGE_CONNECTION_STRING=$StorageConn
AZURE_STORAGE_CONTAINER=$BlobContainer

# Frontend build variable (frontend/.env.production):
VITE_API_URL=http://${VmIp}:4000/api
VITE_SITE_URL=https://$WebAppName.azurewebsites.net
"@ | Set-Content -Path $EnvOut -Encoding UTF8

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host " PROVISIONING COMPLETE!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Frontend App   : https://$WebAppName.azurewebsites.net"
Write-Host " Backend VM IP  : $VmIp (SSH: ssh azureuser@$VmIp)"
Write-Host " Blob Container : https://$StorageAccount.blob.core.windows.net/$BlobContainer"
Write-Host " ACR Server     : $AcrName.azurecr.io"
Write-Host " Saved env vars : $EnvOut (keep private, do not commit)"
Write-Host "==================================================================" -ForegroundColor Green
