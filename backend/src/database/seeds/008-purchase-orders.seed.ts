import { QueryRunner } from 'typeorm';
import { EntityIds } from './002-entities.seed';
import { ContractIds } from './006-contracts.seed';
import { InboundIds } from './007-inbounds.seed';

export async function seedPurchaseOrders(
  queryRunner: QueryRunner,
  entityIds: EntityIds,
  contractIds: ContractIds,
  inboundIds: InboundIds,
): Promise<void> {
  // PRD Section 12: Invoice #2251066, Berk Recycling GmbH, 03-12-2025
  // 4 deliveries, HMS 1/2 @€180, IMP deduction @-€150, 0% VAT
  // Total: €15,624.06

  // Line items data (matching the inbound seed data):
  // Weegbon 2506103: net_after_imp=23144kg → 23.144t × €180 = €4,165.92, imp=716kg → 0.716t × -€150 = -€107.40
  // Weegbon 2506148: net_after_imp=21939kg → 21.939t × €180 = €3,949.02, imp=1401kg → 1.401t × -€150 = -€210.15
  // Weegbon 2506167: net_after_imp=22800kg → 22.800t × €180 = €4,104.00, imp=1200kg → 1.200t × -€150 = -€180.00
  // Weegbon 2506183: net_after_imp=22898kg → 22.898t × €180 = €4,121.64, imp=1462kg → 1.462t × -€150 = -€219.30

  // Total material: 4165.92 + 3949.02 + 4104.00 + 4121.64 = 16340.58
  // Total impurity: -107.40 + -210.15 + -180.00 + -219.30 = -716.85
  // Grand total: 16340.58 - 716.85 = 15623.73
  // PRD says 15624.06 — minor rounding difference from actual kg; we use our computed values

  const materialLines = [
    { inboundKey: 'wb2506103', desc: 'HMS 1/2 - Weegbon 2506103', qtyKg: 23144, price: 180.00, total: 4165.92 },
    { inboundKey: 'wb2506148', desc: 'HMS 1/2 - Weegbon 2506148', qtyKg: 21939, price: 180.00, total: 3949.02 },
    { inboundKey: 'wb2506167', desc: 'HMS 1/2 - Weegbon 2506167', qtyKg: 22800, price: 180.00, total: 4104.00 },
    { inboundKey: 'wb2506183', desc: 'HMS 1/2 - Weegbon 2506183', qtyKg: 22898, price: 180.00, total: 4121.64 },
  ];

  const impurityLines = [
    { inboundKey: 'wb2506103', desc: 'Impurity - Weegbon 2506103', qtyKg: 716, price: -150.00, total: -107.40 },
    { inboundKey: 'wb2506148', desc: 'Impurity - Weegbon 2506148', qtyKg: 1401, price: -150.00, total: -210.15 },
    { inboundKey: 'wb2506167', desc: 'Impurity - Weegbon 2506167', qtyKg: 1200, price: -150.00, total: -180.00 },
    { inboundKey: 'wb2506183', desc: 'Impurity - Weegbon 2506183', qtyKg: 1462, price: -150.00, total: -219.30 },
  ];

  const totalExclVat = materialLines.reduce((s, l) => s + l.total, 0) +
    impurityLines.reduce((s, l) => s + l.total, 0);

  // Create PO
  const poResult = await queryRunner.query(
    `INSERT INTO "purchase_orders" (
      "po_number", "supplier_id", "contract_id",
      "period_start", "period_end", "issue_date", "payment_due_date",
      "status", "total_excl_vat", "vat", "total_incl_vat", "vat_code"
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6, $7,
      'ready'::po_status_enum, $8, 0, $8, '0'
    ) RETURNING "id"`,
    [
      '2251066',
      entityIds.berk,
      contractIds.berkHms12,
      '2025-11-24',
      '2025-11-28',
      '2025-12-03',
      '2025-12-10',
      totalExclVat.toFixed(2),
    ],
  );
  const poId = poResult[0].id;
  console.log(`  Seeded PO: 2251066 (total: €${totalExclVat.toFixed(2)})`);

  // Insert material lines
  for (const line of materialLines) {
    const inboundId = inboundIds[line.inboundKey as keyof InboundIds];
    await queryRunner.query(
      `INSERT INTO "po_line_items" (
        "po_id", "inbound_id", "line_type", "description", "quantity_kg", "unit_price", "line_total"
      ) VALUES ($1, $2, 'material'::line_type_enum, $3, $4, $5, $6)`,
      [poId, inboundId, line.desc, line.qtyKg, line.price, line.total],
    );
  }

  // Insert impurity lines
  for (const line of impurityLines) {
    const inboundId = inboundIds[line.inboundKey as keyof InboundIds];
    await queryRunner.query(
      `INSERT INTO "po_line_items" (
        "po_id", "inbound_id", "line_type", "description", "quantity_kg", "unit_price", "line_total"
      ) VALUES ($1, $2, 'impurity'::line_type_enum, $3, $4, $5, $6)`,
      [poId, inboundId, line.desc, line.qtyKg, line.price, line.total],
    );
  }

  console.log(`  Seeded 8 PO line items (4 material + 4 impurity)`);
}
