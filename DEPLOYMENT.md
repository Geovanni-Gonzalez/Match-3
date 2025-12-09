# Deployment Guide

## 📋 Tabla de Contenidos

- [Environments](#environments)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring](#monitoring)

---

## 🌍 Environments

### Development

- **Frontend**: <http://localhost:3000>
- **Backend**: <http://localhost:4000>
- **Database**: localhost:3306

### Staging

- **Frontend**: <https://staging.match3.com>
- **Backend**: <https://api-staging.match3.com>
- **Database**: RDS staging instance

### Production

- **Frontend**: <https://match3.com>
- **Backend**: <https://api.match3.com>
- **Database**: RDS production instance

---

## 🐳 Docker Deployment

### Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build server
docker-compose build client
```

### Run Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d db
docker-compose up -d server
docker-compose up -d client

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Cloud Deployment

### Option 1: Vercel + Railway

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd programa/client
vercel --prod
```

#### Backend (Railway)

1. Conecta tu repositorio a Railway
2. Configura variables de entorno
3. Deploy automático en push a main

### Option 2: AWS

#### Frontend (S3 + CloudFront)

```bash
# Build
cd programa/client
npm run build

# Deploy to S3
aws s3 sync build/ s3://match3-frontend --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

#### Backend (ECS)

```bash
# Build and push Docker image
docker build -t match3-server ./programa/server
docker tag match3-server:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/match3-server:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/match3-server:latest

# Update ECS service
aws ecs update-service --cluster match3 --service match3-server --force-new-deployment
```

### Option 3: Google Cloud

#### Frontend (Cloud Storage + CDN)

```bash
# Build
cd programa/client
npm run build

# Deploy
gsutil -m rsync -r -d build/ gs://match3-frontend
```

#### Backend (Cloud Run)

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/match3-server ./programa/server
gcloud run deploy match3-server --image gcr.io/PROJECT_ID/match3-server --platform managed
```

---

## 🔐 Environment Variables

### Server (.env)

```env
# Server
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# Database
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_DATABASE=matchdb
DB_PORT=3306

# Security
CORS_ORIGIN=https://match3.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Client (.env)

```env
# API
REACT_APP_API_URL=https://api.match3.com

# Optional: Analytics
REACT_APP_GA_ID=G-XXXXXXXXXX
```

---

## 🗄️ Database Setup

### Production Database

```sql
-- Create database
CREATE DATABASE matchdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'match3_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON matchdb.* TO 'match3_user'@'%';
FLUSH PRIVILEGES;
```

### Migrations

```bash
# Run migrations
cd programa/server
npm run migrate

# Rollback
npm run migrate:rollback
```

### Backups

```bash
# Backup database
mysqldump -h DB_HOST -u DB_USER -p DB_DATABASE > backup_$(date +%Y%m%d).sql

# Restore
mysql -h DB_HOST -u DB_USER -p DB_DATABASE < backup_20231201.sql
```

---

## 📊 Monitoring

### Health Checks

```bash
# Server health
curl https://api.match3.com/api/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Logs

```bash
# Docker logs
docker-compose logs -f server

# CloudWatch (AWS)
aws logs tail /aws/ecs/match3-server --follow

# Cloud Logging (GCP)
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Metrics

- **Uptime**: Use UptimeRobot or Pingdom
- **Performance**: New Relic or Datadog
- **Errors**: Sentry
- **Analytics**: Google Analytics or Mixpanel

---

## 🔄 CI/CD Pipeline

### GitHub Actions

El proyecto incluye workflows de CI/CD:

- **ci.yml**: Tests y build en cada push
- **pr-checks.yml**: Verificación de PRs
- **deploy.yml**: Deploy automático (configurar)

### Manual Deployment

```bash
# 1. Build
npm run build

# 2. Test
npm test

# 3. Deploy
# (Según plataforma elegida)
```

---

## 🚨 Rollback

### Docker

```bash
# Revert to previous image
docker-compose down
docker-compose up -d --force-recreate
```

### Vercel

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback DEPLOYMENT_URL
```

---

## ✅ Post-Deployment Checklist

- [ ] Verificar health check
- [ ] Probar funcionalidad crítica
- [ ] Revisar logs por errores
- [ ] Verificar métricas de performance
- [ ] Confirmar que backups funcionan
- [ ] Actualizar documentación si es necesario

---

## 📞 Support

Para problemas de deployment, contacta al equipo DevOps o abre un issue.
