# Amsterdam Scrap Terminal (AST) — Operations Platform
## Product Requirements Document (PRD)
**Version 1.0 | February 2026 | For Claude Code Implementation**

---

## 1. Executive Summary

Amsterdam Scrap Terminal B.V. (AST) is a scrap metal trading and processing facility located in Amsterdam, Netherlands (Vlothavenweg 1, 1013 BJ Amsterdam). AST buys scrap metal from a network of European suppliers under long-term purchase contracts and daily spot deals, processes and stores the material in their yard, and sells consolidated shipments to buyers — typically full ship loads.

**Current tools (to be replaced):**
- Legacy weighbridge software (standalone, not integrated)
- WhatsApp groups for quality communication between scale operator and yard
- Excel spreadsheets for purchase invoice generation
- NewTon ERP for manual purchase invoice booking
- Paper weighbridge tickets

**Goal:** A single integrated Operations Platform that covers the complete flow from truck arrival → quality inspection → inventory → purchase order generation → invoice approval.

---

## 2. Business Context & Operational Flow

### 2.1 Core Business Model

- **BUYING:** Accepting inbound deliveries from European suppliers (Germany, NL, Belgium) under purchase contracts. Material types: HMS 1/2, HMS V2, Rebars, and other ferrous/non-ferrous metals.
- **SELLING:** Consolidating purchased material in the Amsterdam yard and selling to industrial buyers via ship load.
- **MARGIN:** Spread between buying cost (per contract price, adjusted for quality deductions) and selling price.

### 2.2 Inbound Material Flow (Current State → To Be Digitized)

1. **TRUCK ARRIVAL:** Truck arrives at inbound scale FULL (Gross Weight). Driver presents WTN (Waste Transfer Note) / Annex 7 document.
2. **WEIGH-IN (1st Weighing):** Operator opens record in weighbridge software. Inputs: license plate (Kenteken), supplier name (Opdrachtgever), selects purchase contract. System records Gross Weight + timestamp.
3. **YARD COMMUNICATION:** Operator messages quality personnel via WhatsApp group: license plate, supplier, material type, complaints/notes. *(To be replaced by in-app notification)*
4. **UNLOADING:** Quality personnel direct truck to a yard location (e.g., location '11'). Truck unloads. Quality personnel assess: HMSA% (premium quality), HMSB% (lower quality), Impurity% (vuil — dirt/plastic/waste), special findings (battery/accu, gas tubes, water, plastic).
5. **QUALITY FEEDBACK:** Quality personnel report findings back. *(To be replaced by mobile app entry)*
6. **WEIGH-OUT (2nd Weighing):** Truck returns to scale EMPTY. Net Weight = Gross - Tare.
7. **TICKET GENERATION:** Operator enters quality data. Ticket printed (1 for driver, 1 kept). Digital PDF archived.
8. **PURCHASE INVOICE GENERATION:** Weekly, AST generates buyer-issued purchase invoice (Inkoopfactuur/Credit Nota) per supplier, listing all deliveries with net quantities, impurity deductions, unit price, total.
9. **ERP BOOKING:** Invoice booked in NewTon ERP as Inkoop (purchase).

### 2.3 Key Observations from Current System Screenshots

- **AST Excel Invoice Template columns:** Receipt Nr, Truck/Barge, Date, Material, Contract Nr, Tonnage, Imp., Imp. Qty (ton), Net Qty (ton), Contract Price EUR, Total Price
- **NewTon ERP Invoice structure (Invoice #2251066, Berk Recycling GmbH, 03-12-2025, Total: €15,624.06):**
  - Line per delivery: HMS 1/2, Weegbon# (e.g., 2506103), Quantity 23.144 ton, Price €180/ton → Line total
  - Impurity deduction line: -150.00 EUR/ton × impurity quantity → negative line
  - 4 deliveries in this invoice, 0% VAT (EU cross-border)
- **Weegbon numbers** are the primary link between weighbridge records and invoices
- **Impurity deduction rate** is separate from base material price (e.g., HMS 1/2 = €180/ton, impurity penalty = -€150/ton or €0 depending on contract)
- **Some suppliers get 0 impurity deduction** (no penalty), others get charged

---

## 3. Product Vision & Goals

Build a **web-based Operations Platform** as the single source of truth for AST's buying, inventory, and selling operations.

### 3.1 Primary Goals
- Digitize inbound truck flow from 1st weighing to completed record
- Replace WhatsApp quality communication with structured in-app workflow
- Automate purchase order/invoice generation from weighbridge data + contract pricing
- Provide real-time inventory visibility (material type, quality, location, cost)
- Support invoice matching and approval workflow
- Management dashboard with KPIs

### 3.2 Key Principles
- Mobile-first for yard/quality personnel
- Desktop for scale operators and management
- Weighbridge hardware integration via API
- Full audit trail for all movements and financial transactions
- Dutch/English bilingual interface

---

## 4. Users & Roles

| Role | Primary Responsibilities | Key Access |
|------|--------------------------|------------|
| Scale Operator | Truck weigh-in/weigh-out, inbound records, ticket printing | Weighbridge module, Inbound management |
| Quality Inspector (Yard) | Receive truck notifications, record HMSA/HMSB/IMP, attach photos, update status | Mobile app, Quality fields |
| Operations Manager | Monitor inbound flow, approve purchase orders, manage contracts | Full inbound, Contracts, PO approval |
| Finance / Admin | Review/approve supplier invoices, invoice matching, payment tracking | Invoice module, PO matching |
| Management (CFO/Director) | Dashboard KPIs, contract performance, inventory valuation | Dashboard, Reports (read-only) |
| System Administrator | User management, master data, system config | Admin panel, all modules |

---

## 5. Functional Modules

### 5.1 Entity & Master Data Management

#### 5.1.1 Entities (Relaties)
Each entity record:
- Entity ID (auto)
- Entity Type: Supplier, Buyer, Transporter, Internal (multi-select)
- Company Name (required)
- Address: Street, City, Postal Code, Country
- VAT Number (BTW-nr)
- Chamber of Commerce (KvK)
- IBAN / Bank Details
- Payment Terms (e.g., Net 7 days)
- Contact Persons: Name, Email, Phone, Role
- Default Currency (EUR)
- Notes / Internal Remarks
- Active / Inactive status

#### 5.1.2 Material Types
- Material Code (e.g., HMS12, HMS-V2, REBAR, ZORBA)
- Material Name (Dutch / English)
- Material Category (Ferrous, Non-Ferrous, Mixed)
- Default Unit (Ton / kg)
- Active / Inactive

#### 5.1.3 Yard Locations
- Location Code (e.g., '11', 'A1', 'DOCK-2')
- Location Name
- Location Type (Storage Bay, Dock, Processing Area)
- Capacity (tons, optional)
- Active / Inactive

#### 5.1.4 Vehicles
- License Plate (Kenteken) — primary key
- Vehicle Type (Truck, Barge, Other)
- Default Transporter (FK → Entity)
- Tare Weight (if known, pre-fill for operators)
- Notes

---

### 5.2 Contract Management

Contracts define the pricing, material type, agreed volume, and timeframe governing all transactions.

#### 5.2.1 Contract Record Fields

| Field | Description | Type |
|-------|-------------|------|
| Contract ID | Auto-generated | Auto |
| Contract Number | Human-readable (e.g., 2299700) | Text, Unique |
| Contract Type | Inkoop (Purchase) or Verkoop (Sale) | Enum |
| Status | Lopend / Gesloten / Concept | Enum |
| Supplier / Buyer | Link to Entity | FK |
| Laden/Lossen party | Transport logistics party | FK → Entity |
| Material Type | Link to Material master | FK |
| Contract Price | Price per 1000 kg (EUR/ton) | Decimal |
| Impurity Deduction Rate | Penalty per ton of impurity (EUR/ton, can be 0) | Decimal |
| Agreed Volume (Gewicht) | Total tonnage in contract (kg) | Integer |
| Already Processed (Reeds/Verwerkt) | **Calculated:** sum of net weights on completed inbounds | Calculated |
| Linked Weight (Gekoppeld gew) | **Calculated:** weight in active (not finalized) inbounds | Calculated |
| Start Date | Contract validity start | Date |
| End Date | Contract validity end | Date |
| Payment Terms | Days after invoice | Integer |
| Terms of Delivery | Incoterms (e.g., Free Delivered Amsterdam) | Text |
| Max Truckloads (Vrachten) | Optional | Integer |
| Standard Weight (Std Gewicht) | Optional default weight per truck | Integer |
| Notes / Omschrijving | Free text | Text |
| Attached Documents | PDF/image of original contract | File |

#### 5.2.2 Contract Progress Visualization
- Progress bar: Agreed Volume vs. Processed vs. Linked
- Remaining available volume
- Days remaining to end date (warning if < 30 days)
- Utilization percentage

#### 5.2.3 Contract List Filters
Status, Type (Inkoop/Verkoop), Supplier/Buyer, Material Type, Date Range. Default: active (Lopend) only.

---

### 5.3 Inbound Management (Weighbridge & Quality)

Core operational module. Every truck delivery = one Inbound record progressing through defined statuses.

#### 5.3.1 Inbound Status Flow
```
Weighed-In → In Yard → Quality Checked → Weighed-Out → Completed
                                                      ↘ Rejected
```

| Status | Description | Who Changes |
|--------|-------------|-------------|
| Weighed-In | 1st weighing done, truck in yard | System (auto on 1st weigh) |
| In Yard | Truck at location, unloading | Quality Inspector (mobile) |
| Quality Checked | Quality assessment complete | Quality Inspector (mobile) |
| Weighed-Out | 2nd weighing done, net weight calculated | System (auto on 2nd weigh) |
| Completed | Ticket printed/saved, record finalized | Scale Operator |
| Rejected | Material rejected, truck sent back | Operator or Quality Inspector |

#### 5.3.2 Inbound Record Fields

**IDENTIFICATION & ADMIN:**
- Weegbon Number (unique, auto or from weighbridge)
- Inbound Date / Timestamp
- License Plate (Kenteken) — auto-lookup from vehicle master
- Transporter (auto-populated or manual)
- Supplier (Opdrachtgever) — FK → Entity
- Leverancier / Ontdoener (waste generator, may differ from Opdrachtgever)
- WTN / Annex 7 Document Reference
- Attached WTN document (photo/PDF)

**CONTRACT & MATERIAL:**
- Contract (filtered by Supplier + Material Type)
- Material Type (auto from contract or manual if no contract)
- Price per 1000 kg (auto from contract or manual override)

**WEIGHING:**
- Weighing 1 — Gross Weight (kg) + Timestamp (from weighbridge integration)
- Weighing 2 — Tare Weight (kg) + Timestamp (from weighbridge integration)
- Net Weight (calculated: W1 - W2)

**YARD & QUALITY:**
- Assigned Yard Location
- HMSA % or kg
- HMSB % or kg
- Impurity / Vuil % → auto-calculates Impurity Weight (kg)
- Net Weight after Impurity (kg) = Net Weight - Impurity Weight
- Special Findings: Accu (battery) y/n + kg, Water y/n + liters, Plastic y/n + kg, Gas Tubes y/n + count, Other (free text)
- Quality Notes (free text)
- Photo Attachments (minimum 3: before unload, during, after)

**FINANCIAL (all calculated):**
- Material Cost = (Net Weight after Impurity / 1000) × Contract Price
- Impurity Deduction = (Impurity Weight / 1000) × Impurity Deduction Rate (negative)
- Total Inbound Value = Material Cost + Impurity Deduction

**NOTES:**
- Arrival Complaints / Operator Notes

#### 5.3.3 Weighbridge Integration
The Platform integrates with weighbridge hardware via API:
- **Push:** Create weighing session in weighbridge when Inbound is created
- **Pull:** Receive 1st weight (gross) automatically when truck weighed in
- **Pull:** Receive 2nd weight (tare) automatically when truck weighed out
- Auto-calculate Net Weight on receive
- Support both real-time webhook callbacks and polling fallback
- **Manual weight entry as fallback** if integration unavailable

> **Note:** V1 should implement a mock weighbridge integration. Real integration spec depends on the weighbridge system's API documentation. Platform must expose a webhook endpoint: `POST /api/webhooks/weighbridge`

#### 5.3.4 Mobile App for Quality Inspectors
Mobile-optimized interface (PWA or React Native):
- Live list of Inbound records with status 'Weighed-In'
- Filter by material type, section, date
- View all inbound details
- Assign Yard Location
- Enter HMSA / HMSB / Impurity %
- Enter special findings with amounts
- Take and attach photos from device camera
- Update status: Weighed-In → In Yard → Quality Checked
- Mark as Rejected with reason
- **Offline support:** data entry works offline, syncs when connectivity restored

#### 5.3.5 Notifications
When Inbound is created (Weighed-In), system sends in-app notification to all Quality Inspector role users. Notification includes: License plate, Supplier name, Material type, Arrival complaints.

#### 5.3.6 Weighbridge Ticket Generation
On Completed status, generate printable/PDF ticket containing:
- AST company logo and details
- Weegbon number, Date, Time
- License plate, Transporter, Supplier
- Material type, Contract reference
- Gross weight, Tare weight, Net weight
- Impurity % and weight
- Net weight after impurity
- HMSA/HMSB breakdown
- Special findings if any
- Operator notes
- QR code linking to digital record

Auto-saved as PDF in the Inbound record.

---

### 5.4 Inventory Management

Updated automatically as inbound records are completed.

#### 5.4.1 Inventory Position Structure
Tracked at: **Material Type + Yard Location + Quality Grade**

Each position:
- Material Type
- Yard Location
- Total Weight (kg) — running balance
- Average Purchase Cost (EUR/ton) — weighted average
- Total Cost (EUR) — current inventory value
- Contributing Inbound Records (traceability)
- Last Updated timestamp

#### 5.4.2 Inventory Movements
- **INBOUND INCREASE:** Completed Inbound → increases inventory by Net Weight after Impurity
- **OUTBOUND DECREASE:** Completed Outbound/Sale → decreases inventory
- **ADJUSTMENTS:** Manual adjustments with mandatory reason code + approver

#### 5.4.3 Inventory Reports
- Total Inventory by Material Type (with average cost)
- Detailed Inventory by Location
- Inventory Valuation Report (quantity × average cost)
- Inventory Movement History (date range filter)
- Inventory Aging (time material has been in yard)

---

### 5.5 Purchase Orders & Supplier Invoice Management

**Important:** AST issues purchase invoices (Inkoopfactuur) TO suppliers — AST is the buyer and initiates the invoice. This is non-standard (buyer-issued invoice).

#### 5.5.1 Purchase Order Generation
System auto-aggregates completed Inbound records per supplier per period (default: weekly) into a PO draft.

**PO Line Items (matching observed NewTon structure):**
- Per material delivery (per weegbon): Material type, Weegbon#, Date, Net Qty (tons), Unit Price (EUR/ton), Line Total
- Per impurity deduction: 'Impurity', Weegbon#, Date, Impurity Qty (tons), Deduction Rate (negative), Line Total
- Summary: Total excl. VAT, VAT (0% EU cross-border), Total incl. VAT

#### 5.5.2 PO Fields

| Field | Description |
|-------|-------------|
| PO Number | Auto-generated sequential |
| Supplier | FK → Entity |
| Contract Reference | FK → Contract |
| Period | Date range (e.g., 01-12-2025 to 07-12-2025) |
| Issue Date | PO generation date |
| Payment Due Date | Issue Date + Payment Terms (days) |
| Currency | EUR |
| VAT Code | EU / NL |
| Line Items | Array of material + impurity lines per weegbon |
| Total Excl. VAT | Calculated |
| VAT Amount | Calculated |
| Total Incl. VAT | Calculated |
| Status | Draft → Approved → Sent → Accepted → Paid |
| PDF | Auto-generated |

#### 5.5.3 Invoice Approval Workflow
```
Draft (auto-generated) 
  → Approved (Operations Manager)
  → Sent (Finance sends to supplier)
  → Accepted (Supplier confirms)
  → Paid (Finance marks paid)
```
- 2-level authorization for invoices above configurable threshold (e.g., CFO required > €50,000)

#### 5.5.4 Invoice Matching (3-Way Match)
- **EXACT MATCH:** System = supplier amounts → auto-approve
- **NEAR MATCH:** Variance within tolerance (configurable, e.g., ±€5) → flag for review
- **MISMATCH:** Variance above tolerance → hold, require manual resolution

Matching compares: Quantity per delivery, Unit prices, Impurity deductions, Totals.

#### 5.5.5 Credit Notes
System supports credit notes referencing original invoices with negative correction amounts.

---

### 5.6 Outbound & Sales Management

#### 5.6.1 Sale Order
- Buyer (FK → Entity)
- Material Type + Quantity (tons)
- Sale Price (EUR/ton)
- Shipment date and vessel/truck reference
- Source inventory deduction (which yard locations depleted)
- Sale Invoice generation
- Status: Draft → Confirmed → Shipped → Invoiced → Paid

#### 5.6.2 Sale Invoice
Standard outbound invoice (Verkoopfactuur): AST as seller, buyer details, material/quantity/price/total, VAT treatment, payment terms.

---

### 5.7 Dashboard & Reporting

#### 5.7.1 Dashboard Widgets
- **LIVE OPERATIONS:** Active trucks in yard, trucks awaiting 2nd weighing, open inbounds by material type
- **TODAY:** Inbounds completed, tonnage received, purchase value
- **CONTRACTS:** Active contracts, expiring within 30 days, near volume limit (>80% utilized)
- **INVENTORY:** Total by material type (tons + EUR value), by location
- **INVOICES:** Open/unsent POs, awaiting approval, overdue receivables
- **RECENT:** Last 10 completed inbounds

#### 5.7.2 Reports
- **Inbound Report:** Date range, filter by supplier/material/contract. Export Excel/PDF.
- **Inventory Report:** Point-in-time or movement. Detailed and summary.
- **Contract Performance:** Agreed vs. actual volume, average quality, total value.
- **Supplier Report:** Total tonnage, value, quality stats, invoice history.
- **Financial Summary:** Total purchases by period, total sales, gross margin.
- **Weighbridge Ticket List:** Searchable, reprintable.

---

### 5.8 Document Management
- WTN / Annex 7 documents (per inbound)
- Original purchase contracts (per contract)
- Weighbridge tickets (auto PDF, per inbound)
- Purchase invoices and credit notes (auto PDF)
- Sale invoices
- Quality photos (multiple per inbound)

Retention: minimum 7 years (Dutch legal requirement for financial documents).

---

## 6. Non-Functional Requirements

### 6.1 Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend (Web) | React + TypeScript + Tailwind CSS | Modern, maintainable, responsive |
| Frontend (Mobile) | Progressive Web App (PWA) | Yard mobile access, offline support |
| Backend API | NestJS + TypeScript | REST API + WebSocket for real-time |
| Database | PostgreSQL | Relational, strong referential integrity |
| File Storage | S3-compatible (AWS S3 or MinIO) | Documents and photo storage |
| PDF Generation | Puppeteer or PDFKit | Tickets and invoices |
| Auth | JWT + Refresh Tokens + RBAC | Multi-role security |
| Weighbridge | REST API / Webhook receiver | Real-time weight ingestion |
| Email | SMTP / SendGrid | Notifications |
| Deployment | Docker + Docker Compose | Portable deployment |

### 6.2 Performance
- Inbound record creation + 1st weighing confirmation: < 2 seconds
- Dashboard load: < 3 seconds
- Report generation (12 months data): < 10 seconds
- 50+ concurrent users supported
- Mobile usable on 4G/LTE

### 6.3 Security
- HTTPS/TLS 1.2+ for all traffic
- RBAC enforced at API level
- Approved financial records are immutable (corrections via credit notes only)
- Full audit log: user, timestamp, old value, new value
- GDPR-compliant
- Automated database backups

### 6.4 Localization
- Primary: Dutch (NL) for operational terms
- Secondary: English (EN) — configurable per user
- Date format: DD-MM-YYYY
- Number format: European (1.234,56)
- Currency: EUR (€)
- Timezone: Europe/Amsterdam

### 6.5 Reliability
- 99.5% uptime (operations Mon–Sat)
- Offline support for mobile quality app
- Manual weight entry fallback if weighbridge integration unavailable

---

## 7. Core Data Model

All entities include: `created_at`, `updated_at`, `created_by`, `updated_by`

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Entity (Relatie) | id, name, type[], address, vat_nr, iban, payment_terms | 1:N Contracts, 1:N Inbounds |
| MaterialType | id, code, name, category, unit | 1:N Contracts, 1:N Inbounds, 1:N Inventory |
| YardLocation | id, code, name, type, capacity | 1:N Inbounds, 1:N Inventory |
| Vehicle | id, license_plate, type, transporter_id, tare_weight | 1:N Inbounds |
| Contract | id, number, type, entity_id, material_id, price, imp_deduction, agreed_volume, start_date, end_date | 1:N Inbounds, 1:N PurchaseOrders |
| Inbound | id, weegbon_nr, date, vehicle_id, supplier_id, contract_id, material_id, gross_weight, tare_weight, net_weight, hmsa_pct, hmsb_pct, imp_pct, imp_weight, net_weight_after_imp, status, location_id | N:1 Contract, N:1 Supplier, 1:N Photos |
| WeighbridgeTicket | id, inbound_id, ticket_number, printed_at, pdf_url | N:1 Inbound |
| InventoryPosition | id, material_id, location_id, quantity_kg, avg_cost_eur_ton, total_cost_eur | N:1 Material, N:1 Location |
| InventoryMovement | id, inbound_id/outbound_id, material_id, location_id, type, quantity_kg, cost_eur | N:1 Inbound or Outbound |
| PurchaseOrder | id, po_number, supplier_id, contract_id, period_start, period_end, status, total_excl_vat, vat, total_incl_vat, pdf_url | 1:N POLineItems |
| POLineItem | id, po_id, inbound_id, line_type (material/impurity), quantity_kg, unit_price, line_total | N:1 PO, N:1 Inbound |
| SaleOrder | id, order_number, buyer_id, material_id, quantity_kg, unit_price, shipment_date, status | 1:N SaleInvoices |
| Document | id, parent_type, parent_id, document_type, filename, file_url | Polymorphic |
| AuditLog | id, entity_type, entity_id, action, old_value, new_value, user_id, timestamp | Universal |
| User | id, name, email, role, active | RBAC |

---

## 8. API Endpoints

All endpoints require JWT auth except the weighbridge webhook (shared secret).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Authenticate, return JWT |
| GET | /api/entities | List entities (filter by type) |
| GET/POST | /api/contracts | List / create contracts |
| GET | /api/contracts/:id/progress | Contract utilization |
| GET/POST | /api/inbounds | List / create inbound records |
| PATCH | /api/inbounds/:id | Update inbound (status, quality, location) |
| POST | /api/inbounds/:id/weigh | Record weighing (from weighbridge) |
| POST | /api/inbounds/:id/complete | Finalize, generate ticket |
| POST | /api/inbounds/:id/photos | Upload quality photos |
| GET | /api/inbounds/:id/ticket | Download ticket PDF |
| GET | /api/inventory | Current inventory positions |
| GET | /api/inventory/movements | Movement history |
| GET/POST | /api/purchase-orders | List / generate PO drafts |
| PATCH | /api/purchase-orders/:id/approve | Approve PO |
| GET | /api/purchase-orders/:id/pdf | Download PO PDF |
| GET/POST | /api/sale-orders | List / create sale orders |
| GET | /api/reports/inbounds | Inbound report (CSV/PDF) |
| GET | /api/reports/inventory | Inventory report |
| GET | /api/dashboard/summary | Dashboard KPI data |
| POST | /api/webhooks/weighbridge | Receive weight data (shared secret) |

---

## 9. UX Workflows

### 9.1 Scale Operator — Weigh-In (< 2 minutes target)
1. Enter license plate → auto-fills vehicle/transporter
2. Select supplier → contract list auto-filters
3. Select contract → material and price auto-fill
4. Click 'Wegen' → wait for weighbridge 1st weight (or manual entry)
5. Enter arrival notes/complaints
6. Inbound created, status = Weighed-In. Notification sent to quality inspectors.

### 9.2 Scale Operator — Weigh-Out
1. Locate inbound record (by license plate or list)
2. Click 'Weigh Out' → weighbridge 2nd weight received
3. Enter/confirm quality data
4. Click 'Complete' → ticket generated

### 9.3 Quality Inspector (Mobile)
1. Open app → see trucks awaiting quality check
2. Tap truck → view details (plate, supplier, material, arrival notes)
3. Enter yard location, HMSA/HMSB/IMP percentages
4. Take photos from device camera
5. Add special findings if any
6. Tap 'Quality Done' → status updates, operator notified

### 9.4 Finance — Invoice Workflow
1. View list of PO drafts for the week
2. Open PO → review line items vs. weighbridge tickets
3. Approve or request correction
4. Download/send PDF to supplier
5. Mark as paid when funds received

---

## 10. Business Logic (Critical Formulas)

```
Net Weight after Impurity = net_weight × (1 - imp_pct / 100)

Material Cost = (net_weight_after_imp / 1000) × contract_price_per_ton

Impurity Cost = ((net_weight - net_weight_after_imp) / 1000) × impurity_deduction_rate
               [negative value — deduction from payment]

Total Inbound Value = Material Cost + Impurity Cost

Contract Processed Weight = SUM(net_weight_after_imp) for all Completed inbounds on this contract

Contract Linked Weight = SUM(net_weight) for all Weighed-In / In Yard inbounds on this contract

Average Inventory Cost = weighted average, recalculated on each inventory movement
```

---

## 11. Dutch Language Reference

| Dutch Term | English | Context |
|------------|---------|---------|
| Inkoopfactuur | Purchase Invoice | Buyer-issued invoice to supplier |
| Verkoopfactuur | Sale Invoice | AST invoice to buyer |
| Weegbon | Weighbridge Ticket | Unique ID per weighing event |
| Kenteken | License Plate | Vehicle registration |
| Opdrachtgever | Client / Principal | Supplier who ordered transport |
| Afzender | Sender / Shipper | Who sends the material |
| Ontdoener | Waste Producer | Original waste generator |
| Afnemer | Buyer / Recipient | Who receives material (AST) |
| Leverancier | Supplier | Material supplier |
| Vuil / IMP | Impurity / Contamination | Non-material content deducted |
| Inkoop | Purchase | Buying side |
| Verkoop | Sale | Selling side |
| Lopend | Active / Running | Contract status |
| Gesloten | Closed | Contract status |
| Gewicht | Weight | — |
| Reeds/Verwerkt | Already Processed | Contract volume delivered so far |
| Gekoppeld gew | Linked Weight | Weight in active transactions |
| Betalingsconditie | Payment Terms | — |
| Bijlagen | Attachments | Documents |
| HMSA | High-quality scrap fraction | Thicker, cleaner, more valuable |
| HMSB | Lower quality scrap fraction | Thinner, more mixed |

---

## 12. Seed Data for Development

Use the following real data from observed screenshots to seed the dev database:

**Suppliers:**
- Berk Recycling GmbH, Velder Dyck 21, DE 47624 Kevelaer, Germany, VAT: DE360429848
- Emsschrott GmbH & Co. KG (referenced in weighbridge records)
- Derk Recycling GmbH (referenced in purchase invoice)

**Materials:**
- HMS12 / HMS 1/2 (Heavy Melting Scrap 1/2)
- HMS-V2 / HMS V2
- REBAR / Rebars

**Example Contract:**
- Supplier: Emsschrott GmbH & Co. KG
- Material: Rebars
- Agreed Volume: 150,000 kg
- Start: 14-10-2025 | End: 04-12-2025
- Status: Lopend

**Example Inbound Records (from Invoice #2251066):**

| Weegbon | Date | Material | Net Qty (ton) | IMP (ton) | Net after IMP | Price (€/ton) |
|---------|------|----------|---------------|-----------|---------------|---------------|
| 2506103 | 24-11-2025 | HMS 1/2 | 23.860 | 0.716 | 23.144 | 180.00 |
| 2506148 | 26-11-2025 | HMS 1/2 | 23.340 | 1.401 | 21.939 | 180.00 |
| 2506167 | 27-11-2025 | HMS 1/2 | 24.000 | 1.200 | 22.800 | 180.00 |
| 2506183 | 28-11-2025 | HMS 1/2 | 24.360 | 1.462 | 22.898 | 180.00 |

**Example PO:**
- Invoice #2251066, Berk Recycling GmbH, 03-12-2025
- Total: €15,624.06 (4 deliveries, HMS 1/2 @€180, IMP deduction @-€150, 0% VAT)

**AST Company Details (for invoice templates):**
- Amsterdam Scrap Terminal B.V.
- Vlothavenweg 1, 1013 BJ Amsterdam
- Tel: +31(0)20 705 2333
- VAT: NL856875983B01
- KvK: 67207405
- IBAN: NL76UGBI0709898894

---

## 13. Implementation Build Sequence

Build in this priority order:

1. Database schema + migrations (all tables, indexes, constraints)
2. Authentication system (users, roles, JWT, RBAC)
3. Master data CRUD (entities, materials, locations, vehicles)
4. Contract management module
5. Inbound management core flow (weigh-in → quality → weigh-out → complete)
6. Weighbridge webhook integration endpoint (mock implementation first)
7. Mobile PWA for quality inspectors
8. Inventory management (auto-update on inbound completion)
9. Purchase order generation and approval workflow
10. Invoice PDF generation (weighbridge ticket + purchase invoice)
11. Outbound / sale management
12. Dashboard and reports
13. Document management
14. Email notifications

---

## 14. Out of Scope (V1)

- Full ERP integration (NewTon) — V1 exports data for manual import; direct sync is Phase 2
- Letter of Credit / Trade Finance features
- Multi-currency support (EUR only)
- Advanced pricing engine with market-linked prices
- Supplier self-service portal
- Automated email sending of invoices (PDF generation in scope, sending is Phase 2)
- Barcode/RFID tracking of individual material batches
- GPS tracking of trucks

---

## 15. Success Criteria

- 100% of inbound truck events recorded in Platform (zero paper-only records)
- WhatsApp quality communication fully replaced by in-app notifications
- Purchase invoices generated automatically from weighbridge data (zero manual Excel)
- Real-time inventory available at any point without manual counting
- Scale operators complete full weigh-in in under 2 minutes
- Management can view live dashboard without requesting reports
- All weighbridge tickets digitally stored and searchable
