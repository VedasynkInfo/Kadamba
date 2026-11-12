# ==============================================================================
# Kadamba Designer Studio — Idempotent Azure Deployment Script (PowerShell)
# Provisions (or reuses existing resources in RESOURCE_GROUP):
#   1. Resource Group
#   2. Azure Storage Account + Public Blob Container (kadamba-media) + CORS
#   3. Azure App Service (Frontend Hosting, auto-detecting supported Node LTS)
#   4. Azure Container Registry (ACR)
#   5. Azure Linux Virtual Machine (Backend API + Nginx)
# ==============================================================================
$ErrorActionPreference = "Stop"

$Suffix = Get-Random -Minimum 1000 -Maximum 9999
$ResourceGroup = if ($env:RESOURCE_GROUP) { $env:RESOURCE_GROUP } else { "kadamba-prod-rg" }
$Location = if ($env:LOCATION) { $env:LOCATION } else { "centralindia" }
$AppServicePlan = if ($env:APP_SERVICE_PLAN) { $env:APP_SERVICE_PLAN } else { "kadamba-app-plan" }
$BlobContainer = if ($env:BLOB_CONTAINER) { $env:BLOB_CONTAINER } else { "kadamba-media" }
$VmName = if ($env:VM_NAME) { $env:VM_NAME } else { "kadamba-api-vm" }
$VmSize = if ($env:VM_SIZE) { $env:VM_SIZE } else { "Standard_B1s" }
$CorsOrigins = if ($env:FRONTEND_CORS_ORIGINS) { $env:FRONTEND_CORS_ORIGINS } else { "*" }

# 1. Login check
az account show --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[*] Logging into Azure..." -ForegroundColor Yellow
    az login
}

# 2. Resource Group
Write-Host "`n[1/5] Ensuring Resource Group '$ResourceGroup'..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output table

# Reuse existing storage account / webapp / acr in the RG if already created
$ExistingStorage = (az storage account list -g $ResourceGroup --query "[0].name" -o tsv 2>$null)
$StorageAccount = if ($env:STORAGE_ACCOUNT) { $env:STORAGE_ACCOUNT } elseif ($ExistingStorage) { $ExistingStorage } else { "kadambastore$Suffix" }

$ExistingWebApp = (az webapp list -g $ResourceGroup --query "[0].name" -o tsv 2>$null)
$WebAppName = if ($env:WEB_APP_NAME) { $env:WEB_APP_NAME } elseif ($ExistingWebApp) { $ExistingWebApp } else { "kadamba-web-$Suffix" }

$ExistingAcr = (az acr list -g $ResourceGroup --query "[0].name" -o tsv 2>$null)
$AcrName = if ($env:ACR_NAME) { $env:ACR_NAME } elseif ($ExistingAcr) { $ExistingAcr } else { "kadambaacr$Suffix" }

Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Kadamba Designer Studio — Azure Infrastructure Provisioning" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " Resource Group : $ResourceGroup ($Location)"
Write-Host " Storage        : $StorageAccount (container: $BlobContainer)"
Write-Host " Frontend App   : $WebAppName.azurewebsites.net"
Write-Host " ACR            : $AcrName.azurecr.io"
Write-Host " Backend VM     : $VmName ($VmSize)"
Write-Host "=================================================================="

# 3. Azure Storage Account + Blob Container + CORS
Write-Host "`n[2/5] Ensuring Storage Account '$StorageAccount' & Container '$BlobContainer'..." -ForegroundColor Cyan
az storage account show --name $StorageAccount --resource-group $ResourceGroup --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    az storage account create `
      --name $StorageAccount `
      --resource-group $ResourceGroup `
      --location $Location `
      --sku Standard_LRS `
      --kind StorageV2 `
      --allow-blob-public-access true `
      --min-tls-version TLS1_2 `
      --output table
} else {
    Write-Host "[OK] Reusing existing Storage Account '$StorageAccount'" -ForegroundColor Green
}

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
az appservice plan show --name $AppServicePlan --resource-group $ResourceGroup --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    az appservice plan create `
      --name $AppServicePlan `
      --resource-group $ResourceGroup `
      --location $Location `
      --sku B1 `
      --is-linux `
      --output table
} else {
    Write-Host "[OK] Reusing existing App Service Plan '$AppServicePlan'" -ForegroundColor Green
}

$NodeRuntimes = az webapp list-runtimes --os-type linux -o tsv 2>$null | Where-Object { $_ -match '^NODE:\d+-lts$' } | Sort-Object { [int](($_ -split ':|-')[1]) }
$NodeRuntime = if ($NodeRuntimes) { $NodeRuntimes | Select-Object -Last 1 } else { "NODE:22-lts" }
Write-Host "[*] Using Linux App Service runtime: $NodeRuntime" -ForegroundColor Yellow

az webapp show --name $WebAppName --resource-group $ResourceGroup --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    az webapp create `
      --name $WebAppName `
      --resource-group $ResourceGroup `
      --plan $AppServicePlan `
      --runtime $NodeRuntime `
      --output table
} else {
    Write-Host "[OK] Reusing existing Web App '$WebAppName'" -ForegroundColor Green
}

az webapp config set `
  --resource-group $ResourceGroup `
  --name $WebAppName `
  --startup-file "npx --yes serve -s dist -l 8080" `
  --output none

# 5. Azure Container Registry (ACR)
Write-Host "`n[4/5] Ensuring Azure Container Registry '$AcrName'..." -ForegroundColor Cyan
az acr show --name $AcrName --resource-group $ResourceGroup --output none 2>$null
if ($LASTEXITCODE -ne 0) {
    az acr create `
      --name $AcrName `
      --resource-group $ResourceGroup `
      --location $Location `
      --sku Basic `
      --admin-enabled true `
      --output table
} else {
    Write-Host "[OK] Reusing existing ACR '$AcrName'" -ForegroundColor Green
}

# 6. Azure Linux Compute VM (Backend API)
Write-Host "`n[5/5] Ensuring Azure Linux VM '$VmName'..." -ForegroundColor Cyan
az vm show --resource-group $ResourceGroup --name $VmName --output none 2>$null
if ($LASTEXITCODE -ne 0) {
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
} else {
    Write-Host "[OK] Reusing existing VM '$VmName'" -ForegroundColor Green
}

Write-Host "[*] Opening ports 80, 443, and 4000 on '$VmName'..." -ForegroundColor Yellow
az vm open-port --resource-group $ResourceGroup --name $VmName --port 80 --priority 1001 --output none
az vm open-port --resource-group $ResourceGroup --name $VmName --port 443 --priority 1002 --output none
az vm open-port --resource-group $ResourceGroup --name $VmName --port 4000 --priority 1003 --output none

$VmIp = (az vm show --resource-group $ResourceGroup --name $VmName --show-details --query publicIps --output tsv)

$EnvOut = "kadamba-azure-env.txt"
@"
# Copy these into backend/.env (local test) or /etc/kadamba.env (production VM)
# DO NOT commit this file to git.

RESOURCE_GROUP="$ResourceGroup"
WEB_APP_NAME="$WebAppName"
VM_NAME="$VmName"
VM_IP="$VmIp"
ACR_NAME="$AcrName"

FRONTEND_URL="https://$WebAppName.azurewebsites.net"
UPLOAD_STORAGE="azure"
AZURE_STORAGE_ACCOUNT="$StorageAccount"
AZURE_STORAGE_KEY="$StorageKey"
AZURE_STORAGE_CONNECTION_STRING="$StorageConn"
AZURE_STORAGE_CONTAINER="$BlobContainer"

# Frontend build variable (frontend/.env.production):
VITE_API_URL="http://${VmIp}:4000/api"
VITE_SITE_URL="https://$WebAppName.azurewebsites.net"
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
