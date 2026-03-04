# Local Dev Setup

# 1.Aşama Yazılım Productiona hazır hale getirilmesi -> burası için bir instructions/referans çıkarılacak
# 2.Aşama Infra kurulması
# 3.Aşama CI/CD github repoma push attığımda sunucuya nasıl deploy olacak
# 4.Aşama Güvenlik
# Deploy alana kadar minio yerine s3 kullanmasına bakabiliriz, s3 credentials verilecek boş bucket(harddisk) erişimi için izin verilecek
# PDF ürettiğim yerde MinIO kullanmasına gerek yok

## Start

```bash
docker-compose up -d
```

## URLs

| Service    | URL                  |
|------------|----------------------|
| Frontend   | http://localhost:5173 |
| API        | http://localhost:3000 |
| MinIO      | http://localhost:9001 |
| PostgreSQL | localhost:5432        |

## Test Accounts

All passwords: `Admin123!`

| Role               | Email             |
|--------------------|-------------------|
| Admin              | admin@ast.nl      |
| Scale Operator     | operator@ast.nl   |
| Quality Inspector  | inspector@ast.nl  |
| Ops Manager        | manager@ast.nl    |
| Finance            | finance@ast.nl    |

MinIO: `ast_minio` / `ast_minio_secret`

PostgreSQL: `ast_user` / `ast_password` (db: `ast_db`)

## Troubleshooting

```bash
# Port conflict — find what's using it
lsof -i :5173
lsof -i :3000

# Nuke everything and start fresh
docker-compose down -v && docker-compose up -d

# Check logs
docker-compose logs -f

# Force rebuild
docker-compose up -d --build

# If frontend dependencies changed (e.g. package.json updated)
docker compose build web --no-cache
docker compose up -d web
```

## What to Test

- [ ] Login with each role — verify different permissions
- [ ] Master Data — create supplier, material, location
- [ ] Contracts — create contract linked to supplier
- [ ] Inbounds — full flow: weigh-in → yard → quality → weigh-out → complete
- [ ] Inventory — check updates after completing an inbound
- [ ] Dashboard — KPIs and recent activity
