# AST Operations Platform

Web-based operations platform for Amsterdam Scrap Terminal — manages scrap metal purchasing from European suppliers, yard operations, inventory tracking, and supplier invoicing (self-billing / inkoopfactuur).

## Features

- Weighbridge ticket management (weegbon)
- Supplier & contract management
- Inbound delivery flow (weigh-in → quality check → weigh-out → complete)
- Impurity deduction calculations
- Inventory tracking with auto-updates
- Purchase order generation
- PDF tickets & invoices
- Role-based access (6 roles)
- Dashboard with KPIs

## Tech Stack

- **Backend:** NestJS + TypeScript + PostgreSQL
- **Frontend:** React + TypeScript + Tailwind CSS + React Query
- **Storage:** MinIO (S3-compatible)
- **Auth:** JWT + RBAC
- **Infra:** Docker Compose

## Run Locally

```bash
docker-compose up -d
```

Open http://localhost:5173 — login with `admin@ast.nl` / `Admin123!`

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for full details.
