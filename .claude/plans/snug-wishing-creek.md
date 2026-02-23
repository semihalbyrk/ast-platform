# PO Status Simplification + Inbound-PO Link + Remove YardLocation Type

## Context
Three improvements requested by user:
1. **PO status flow is over-engineered** — Draft→Approved adds unnecessary friction. POs should be created directly as "approved". Keep statuses for tracking (Approved→Paid) but remove the draft/approval step.
2. **Inbound detail should show existing PO** — If a PO was already generated for an inbound, show "View PO" link instead of "Generate PO" button.
3. **Remove `type` field from YardLocation** — The LocationType enum (storage_bay, dock, processing_area) is not used in any business logic, and frontend/backend values are mismatched anyway.

---

## 1. PO Status: Skip Draft, Create as Approved

### Backend
**`backend/src/modules/purchase-orders/purchase-orders.service.ts`**
- In `generate()` method (~line 141): change initial status from `POStatus.DRAFT` to `POStatus.APPROVED`
- Generate PDF immediately during creation (move PDF generation from `approve()` into `generate()`)
- Replace `approve()` with `markPaid()` (APPROVED → PAID)
- Replace `reject()` with `cancel()` (APPROVED → CANCELLED)

**`backend/src/modules/purchase-orders/purchase-orders.controller.ts`**
- Replace `/approve` with `/mark-paid` PATCH endpoint
- Replace `/reject` with `/cancel` PATCH endpoint

**`backend/src/common/enums/po-status.enum.ts`**
- Simplify to: `APPROVED`, `PAID`, `CANCELLED`

### Frontend
**`frontend/src/pages/purchase-orders/PurchaseOrderDetailPage.tsx`**
- Remove Approve/Reject buttons and reject dialog
- Add "Mark as Paid" button when status is `approved`
- Add "Cancel" button when status is `approved`

**`frontend/src/pages/purchase-orders/PurchaseOrdersPage.tsx`**
- Remove draft/rejected status colors, keep approved/paid

---

## 2. Show Existing PO on Inbound Detail

### Backend
**`backend/src/modules/inbounds/inbounds.service.ts`** (or controller)
- In `findOne()`: add a join or subquery to check if any `POLineItem` references this inbound
- Return `purchaseOrderId` and `purchaseOrderNumber` on the inbound response if exists
- Alternative: add a `@OneToMany` back-reference on `Inbound` entity to `POLineItem`, then eagerly load it

Simplest approach: In the inbound service `findOne()`, do a quick query:
```typescript
const poLineItem = await this.poLineItemRepo.findOne({
  where: { inboundId: id },
  relations: ['purchaseOrder']
});
// Attach to response: { ...inbound, purchaseOrder: poLineItem?.purchaseOrder }
```

### Frontend
**`frontend/src/pages/inbounds/InboundDetailPage.tsx`**
- If `inbound.purchaseOrder` exists: show "View PO: {poNumber}" link → navigates to `/purchase-orders/{poId}`
- If not: show "Generate PO" button (current behavior)

---

## 3. Remove `type` from YardLocation

### Backend
**`backend/src/modules/yard-locations/entities/yard-location.entity.ts`**
- Remove `type` column

**`backend/src/modules/yard-locations/dto/create-yard-location.dto.ts`**
- Remove `type` field and `@IsEnum(LocationType)` validator

**`backend/src/common/enums/location-type.enum.ts`**
- Delete file (or keep if referenced elsewhere)

**`backend/src/common/enums/index.ts`**
- Remove LocationType export

### Frontend
**`frontend/src/pages/yard-locations/YardLocationForm.tsx`**
- Remove Type dropdown from form

**`frontend/src/pages/yard-locations/YardLocationsPage.tsx`**
- Remove Type column from table

---

## Verification
1. `cd backend && npx tsc --noEmit` — zero errors
2. `cd frontend && npx tsc --noEmit` — zero errors
3. Test: Generate PO → should create with "approved" status and PDF immediately
4. Test: Inbound detail for completed inbound with PO → shows "View PO" link
5. Test: Inbound detail for completed inbound without PO → shows "Generate PO" button
6. Test: Yard Location CRUD — no type field
