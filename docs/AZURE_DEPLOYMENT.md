# Azure deployment plan — Kadamba Designer Studio

## Recommended architecture
- **Database:** MongoDB Atlas (Azure region) **or** Azure Cosmos DB for MongoDB. Do **not** switch to PostgreSQL unless you rewrite the Mongoose data layer.
- **Backend:** Azure Linux VM (Ubuntu 22.04/24.04) running Node 20 under `systemd`/PM2, behind Nginx with TLS (Let's Encrypt or Azure Front Door).
- **Frontend:** Container image pushed to Azure Container Registry (ACR) and run on Azure Container Apps (or App Service for Containers).
- **Storage:** Azure Blob Storage (`UPLOAD_STORAGE=azure`, container `kadamba-media` with public blob access + CORS) for uploaded media & responsive variants, plus Azure Managed Disk attached to the VM for `BACKUP_DIR`.
- **Secrets:** Azure Key Vault (or VM-local `/etc/kadamba.env` with 0600 perms) — never commit.

## One-Click Provisioning (Azure Cloud Shell)
Run [deploy-azure.sh](../deploy-azure.sh) directly in [Azure Cloud Shell (Bash)](https://shell.azure.com) (or [deploy-azure.ps1](../deploy-azure.ps1) in PowerShell) to provision:
1. Resource Group (`kadamba-prod-rg`)
2. Storage Account + `kadamba-media` Blob Container (`--public-access blob`) + Blob CORS rules
3. Azure App Service (`NODE:20-lts`) for Frontend
4. Azure Container Registry (ACR)
5. Azure Linux VM (`Ubuntu2204`) for Backend API with ports `80`, `443`, `4000` open

The script writes the resulting `AZURE_STORAGE_*`, `FRONTEND_URL`, and `VM_IP` values into `kadamba-azure-env.txt` (gitignored).

### Azure Blob Storage Environment Variables
Set these in `backend/.env` or `/etc/kadamba.env`:
```ini
UPLOAD_STORAGE=azure
AZURE_STORAGE_CONTAINER=kadamba-media
# Set EITHER connection string OR account + key:
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
# AZURE_STORAGE_ACCOUNT=kadambastore1234
# AZURE_STORAGE_KEY=...
# Optional custom CDN origin:
# AZURE_STORAGE_PUBLIC_URL=https://cdn.kadambastudio.com/kadamba-media
```

## Provisioning order
1. **Database**
   - Create MongoDB Atlas cluster in the same Azure region as the VM.
   - Create DB user + IP allow-list (VM public IP, or VNet peering).
   - Copy SRV `MONGODB_URI`.
2. **VM (backend)**
   - Size: at least 2 vCPU / 4 GB (Node + Mongo? no, Mongo is managed) — B2s is fine for start.
   - Attach a 10+ GB Managed Disk mounted at `/var/data`.
   - Open ports 80/443 (and 22 from your IP only).
3. **Container registry + frontend**
   - `az acr create ...`
   - Build/push the frontend image with `VITE_API_URL`, `VITE_SITE_URL`.
   - Deploy to Container Apps; enable ingress on 443.

## Backend VM bootstrap (run once)
```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo mkdir -p /var/data/uploads /var/data/backups /opt/kadamba
sudo chown -R $USER:$USER /var/data /opt/kadamba

# App
cd /opt/kadamba
git clone <repo> .
cd backend
npm ci
npm run build

# Env
sudo cp .env.example /etc/kadamba.env
sudo chmod 600 /etc/kadamba.env
# edit /etc/kadamba.env: NODE_ENV=production, MONGODB_URI, JWT_SECRET, FRONTEND_URL=https://<frontend>,
# UPLOAD_DIR=/var/data/uploads, BACKUP_DIR=/var/data/backups, TRUST_PROXY=1, ...
```

### systemd unit `/etc/systemd/system/kadamba.service`
```ini
[Unit]
Description=Kadamba API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/kadamba/backend
EnvironmentFile=/etc/kadamba.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kadamba
```

### Nginx reverse proxy
```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 30m;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Frontend container deploy
```bash
cd frontend
docker build \
  --build-arg VITE_API_URL=https://api.example.com/api \
  --build-arg VITE_SITE_URL=https://app.example.com \
  -t <acr>.azurecr.io/kadamba-frontend:latest .
docker push <acr>.azurecr.io/kadamba-frontend:latest
# deploy the image to Container Apps / App Service
```

## First boot tasks (run once)
```bash
cd /opt/kadamba/backend
sudo -u www-data env $(cat /etc/kadamba.env | xargs) npm run seed:admin
sudo -u www-data env $(cat /etc/kadamba.env | xargs) npm run data:backfill-product-slugs
```
Then remove `ADMIN_*` from `/etc/kadamba.env` and restart.

## Health checks
- `GET https://api.example.com/api/health/ready` → 200
- `GET https://api.example.com/api/health` → outbox pending 0, scheduler running
- Backup file appears in `/var/data/backups`

## CI/CD (GitHub Actions)
- On push to `main`: build frontend image → push to ACR → update Container App.
- On push to `main`: SSH to VM → `git pull && npm ci && npm run build && systemctl restart kadamba`.

## Monitoring
- Azure Monitor + Log Analytics for VM; Application Insights optional for Node.
- Alert on `/api/health/ready` non-200 and disk usage > 80%.
