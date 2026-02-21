# CLAUDE.md — AST Operations Platform (Optimized for MVP)

## Project Overview
Building the **Amsterdam Scrap Terminal (AST) Operations Platform** — a web-based system for managing scrap metal buying, yard operations, inventory, and supplier invoicing.

Full requirements are in `AST_Operations_Platform_PRD.md` in this directory.

---

## ⚡ Tech Stack (Simplified, Web-Only)

- **Backend:** NestJS + TypeScript + PostgreSQL
- **Frontend:** React + TypeScript + Tailwind CSS + React Query
- **File Storage:** MinIO (local dev + production — S3 compatible but not AWS-dependent)
- **PDF Generation:** PDFKit (simple, reliable)
- **Auth:** JWT + Refresh Tokens + RBAC
- **Deployment:** Docker + Docker Compose

**What we're NOT doing:**
- ❌ PWA / Service Workers / Offline capability
- ❌ AWS integration (MinIO is sufficient)
- ❌ Advanced mobile optimization (responsive web UI is enough)
- ❌ Microservices / async queues
- ❌ Mobile apps (not in V1)

---

## Project Structure
```
/
├── backend/              # NestJS
├── frontend/             # React (web only)
├── docker-compose.yml
├── CLAUDE.md            # This file
└── AST_Operations_Platform_PRD.md
```

---

## Key Domain Concepts

### Business Model
AST buys scrap metal from European suppliers → stores in Amsterdam yard → sells to buyers in ship loads. Margin = buy price - sell price.

### Core Entity Relationships
```
Supplier (Entity) → Contract → Inbound → Inventory Position
                                        ↓
                              PurchaseOrder (auto-generated)
                                        ↓
                                  Buyer (Entity)
```

### Critical Business Logic
```typescript
// Net weight after impurity deduction
net_weight_after_imp = net_weight * (1 - imp_pct / 100)

// Material cost to AST (what we owe supplier)
material_cost = (net_weight_after_imp / 1000) * contract_price_per_ton

// Impurity penalty (negative — reduces payment to supplier)
impurity_cost = ((net_weight - net_weight_after_imp) / 1000) * impurity_deduction_rate

// Total value of this inbound
total_inbound_value = material_cost + impurity_cost  // impurity_cost is negative

// Contract progress
contract_processed = SUM(net_weight_after_imp) WHERE status = 'Completed'
contract_linked = SUM(net_weight) WHERE status IN ('Weighed-In', 'In Yard')

// Inventory average cost
inventory_avg_cost_per_ton = total_cost_eur / (quantity_kg / 1000)
```

### Inbound Status Flow
```
Weighed-In → In Yard → Quality Checked → Weighed-Out → Completed
                                                       ↘ Rejected
```

---

## User Roles & Permissions

| Role | Key Permissions |
|------|----------------|
| `scale_operator` | Create/update inbounds, print tickets, basic dashboard |
| `quality_inspector` | Update quality fields, upload photos, mobile-optimized views |
| `operations_manager` | All inbound, contracts, approve POs |
| `finance` | Invoice/PO module, payment tracking, financial reports |
| `management` | Read-only dashboard, KPI reports |
| `admin` | Full access, user management, master data |

---

## Important Implementation Notes

### Buyer-Issued Invoices (Inkoopfactuur)
AST is the **buyer** but **issues the invoice** to suppliers (reverse invoice / self-billing). The system must:
- Generate invoices from inbound records, not the other way around
- Link to inbounds via weegbon_nr
- Match NewTon ERP line structure (material + impurity lines)

### Dutch Language
Use Dutch field names in UI by default. See PRD Section 11 for full reference:
- `Weegbon` = Weighbridge Ticket (unique ID)
- `Kenteken` = License Plate
- `Opdrachtgever` = Supplier/Client
- `Vuil/IMP` = Impurity
- `Inkoop` = Purchase | `Verkoop` = Sale

### Weighbridge Integration
V1: Mock implementation only. System must expose webhook:
```
POST /api/webhooks/weighbridge
Authorization: X-Webhook-Secret: {env var}
Body: { weegbon_nr, weight_kg, weighing_number (1 or 2), timestamp }
```
Manual weight entry must always be available as fallback.

### Impurity Deduction Rate
- Some suppliers have `impurity_deduction_rate = 0` (no penalty)
- **Always read from contract** — never assume a default
- Impurity weight is ALWAYS deducted from net weight (regardless of penalty)

---

## Development Conventions

### API Response Format
```typescript
// Success
{ data: T, meta?: { total, page, limit } }

// Error
{ error: { code: string, message: string, details?: any } }
```

### Database Naming
- Tables: `snake_case` plural
- All tables have: `id UUID`, `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft deletes on financial entities: `deleted_at TIMESTAMP NULL`
- Never hard delete financial records

### File Uploads (MinIO)
- Photos: `/{env}/inbounds/{inbound_id}/photos/{filename}`
- PDFs: `/{env}/tickets/{weegbon_nr}.pdf`, `/{env}/invoices/{po_number}.pdf`

### Audit Logging
Every mutation on financial entities (Inbound, Contract, PurchaseOrder, SaleOrder) must write to AuditLog.

---

## Pragmatic Build Sequence

Each module = **1-2 days of work maximum**. Stop after each, show customer demo.

1. ✅ **Module 1:** DB schema + migrations
2. ✅ **Module 2:** Auth (JWT, RBAC, login/logout)
3. **Module 3:** Master Data CRUD (entities, materials, locations) — **simple React forms**
4. **Module 4:** Contract management (CRUD + progress visualization)
5. **Module 5:** Inbound core flow (weigh-in → quality → weigh-out → complete)
6. **Module 6:** Weighbridge mock webhook + manual entry fallback
7. **Module 7:** Inventory (auto-update on inbound completion)
8. **Module 8:** Purchase order auto-generation + approval workflow
9. **Module 9:** PDF generation (tickets + invoices)
10. **Module 10:** Basic dashboard (KPIs, recent inbounds, contract status)
11. **Module 11:** Financial reports (inventory valuation, supplier summary)

**Stop here.** Anything after = Phase 2.

---

## Local Development Setup
```bash
# Start all services
docker-compose up -d

# Access points:
# - API: http://localhost:3000
# - Frontend: http://localhost:5173
# - MinIO console: http://localhost:9001 (user: minioadmin, pass: minioadmin)
# - PostgreSQL: localhost:5432
```

---

## AST Company Details (for templates)
```
Amsterdam Scrap Terminal B.V.
Vlothavenweg 1
1013 BJ Amsterdam
Tel: +31(0)20 705 2333
VAT: NL856875983B01
KvK: 67207405
IBAN: NL76UGBI0709898894
```

---

## Key Decision: What's NOT in This MVP

| Feature | Reason | Phase |
|---------|--------|-------|
| PWA / Offline | Responsive web UI sufficient | 2 |
| AWS integration | MinIO works everywhere | 2 |
| Advanced mobile app | Responsive web sufficient | 2 |
| Email automation | Manual PDF export + send | 2 |
| ERP sync (NewTon) | Manual export to CSV | 2 |
| Multi-tenant | Not needed | TBD |
| Advanced reporting | Basic dashboards sufficient | 2 |
| Document OCR | Manual upload | 2 |

The goal: **Get the customer to day-1 operations in 3 weeks, then iterate based on real feedback.**