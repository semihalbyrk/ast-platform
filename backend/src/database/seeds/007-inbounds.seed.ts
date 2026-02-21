import { QueryRunner } from 'typeorm';
import { EntityIds } from './002-entities.seed';
import { MaterialIds } from './003-materials.seed';
import { ContractIds } from './006-contracts.seed';
import { VehicleIds } from './005-vehicles.seed';
import { LocationIds } from './004-yard-locations.seed';

export interface InboundIds {
  wb2506103: string;
  wb2506148: string;
  wb2506167: string;
  wb2506183: string;
}

export async function seedInbounds(
  queryRunner: QueryRunner,
  entityIds: EntityIds,
  materialIds: MaterialIds,
  contractIds: ContractIds,
  vehicleIds: VehicleIds,
  locationIds: LocationIds,
): Promise<InboundIds> {
  // PRD Section 12 example inbound records
  // All from Berk Recycling, HMS 1/2, contract price 180 EUR/ton, imp deduction 150 EUR/ton
  const inbounds = [
    {
      key: 'wb2506103',
      weegbonNr: '2506103',
      date: '2025-11-24T08:30:00Z',
      vehicleId: vehicleIds.truck1,
      plate: 'KLE-BR-101',
      supplierId: entityIds.berk,
      contractId: contractIds.berkHms12,
      materialId: materialIds.hms12,
      pricePerTon: 180.00,
      grossWeight: 37860,  // net=23860, tare=14000
      tareWeight: 14000,
      netWeight: 23860,
      impPct: 3.00,  // 716/23860 ≈ 3.00%
      impWeight: 716,
      netWeightAfterImp: 23144,
      hmsaPct: 70.00,
      hmsbPct: 27.00,
      locationId: locationIds.bay11,
    },
    {
      key: 'wb2506148',
      weegbonNr: '2506148',
      date: '2025-11-26T09:15:00Z',
      vehicleId: vehicleIds.truck2,
      plate: 'KLE-BR-102',
      supplierId: entityIds.berk,
      contractId: contractIds.berkHms12,
      materialId: materialIds.hms12,
      pricePerTon: 180.00,
      grossWeight: 36840,  // net=23340, tare=13500
      tareWeight: 13500,
      netWeight: 23340,
      impPct: 6.00,  // 1401/23340 ≈ 6.00%
      impWeight: 1401,
      netWeightAfterImp: 21939,
      hmsaPct: 65.00,
      hmsbPct: 29.00,
      locationId: locationIds.bay11,
    },
    {
      key: 'wb2506167',
      weegbonNr: '2506167',
      date: '2025-11-27T10:00:00Z',
      vehicleId: vehicleIds.truck1,
      plate: 'KLE-BR-101',
      supplierId: entityIds.berk,
      contractId: contractIds.berkHms12,
      materialId: materialIds.hms12,
      pricePerTon: 180.00,
      grossWeight: 38000,  // net=24000, tare=14000
      tareWeight: 14000,
      netWeight: 24000,
      impPct: 5.00,  // 1200/24000 = 5.00%
      impWeight: 1200,
      netWeightAfterImp: 22800,
      hmsaPct: 68.00,
      hmsbPct: 27.00,
      locationId: locationIds.bayA1,
    },
    {
      key: 'wb2506183',
      weegbonNr: '2506183',
      date: '2025-11-28T07:45:00Z',
      vehicleId: vehicleIds.truck2,
      plate: 'KLE-BR-102',
      supplierId: entityIds.berk,
      contractId: contractIds.berkHms12,
      materialId: materialIds.hms12,
      pricePerTon: 180.00,
      grossWeight: 37860,  // net=24360, tare=13500
      tareWeight: 13500,
      netWeight: 24360,
      impPct: 6.00,  // 1462/24360 ≈ 6.00%
      impWeight: 1462,
      netWeightAfterImp: 22898,
      hmsaPct: 66.00,
      hmsbPct: 28.00,
      locationId: locationIds.bayA1,
    },
  ];

  const ids: Record<string, string> = {};

  for (const ib of inbounds) {
    // Calculate financials per PRD Section 10 formulas:
    // Material Cost = (net_weight_after_imp / 1000) * price_per_ton
    // Impurity Cost = ((net_weight - net_weight_after_imp) / 1000) * imp_deduction_rate (negative)
    // Total = Material Cost + Impurity Cost
    const materialCost = (ib.netWeightAfterImp / 1000) * ib.pricePerTon;
    const impurityDeduction = -((ib.netWeight - ib.netWeightAfterImp) / 1000) * 150; // imp deduction rate from contract
    const totalInboundValue = materialCost + impurityDeduction;

    const result = await queryRunner.query(
      `INSERT INTO "inbounds" (
        "weegbon_nr", "inbound_date", "vehicle_id", "license_plate",
        "supplier_id", "contract_id", "material_id", "price_per_ton",
        "gross_weight", "gross_weight_at", "tare_weight", "tare_weight_at",
        "net_weight", "location_id",
        "hmsa_pct", "hmsb_pct", "imp_pct", "imp_weight", "net_weight_after_imp",
        "material_cost", "impurity_deduction", "total_inbound_value",
        "status"
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $2, $10, $2,
        $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20,
        'completed'::inbound_status_enum
      ) RETURNING "id"`,
      [
        ib.weegbonNr, ib.date, ib.vehicleId, ib.plate,
        ib.supplierId, ib.contractId, ib.materialId, ib.pricePerTon,
        ib.grossWeight, ib.tareWeight,
        ib.netWeight, ib.locationId,
        ib.hmsaPct, ib.hmsbPct, ib.impPct, ib.impWeight, ib.netWeightAfterImp,
        materialCost.toFixed(2), impurityDeduction.toFixed(2), totalInboundValue.toFixed(2),
      ],
    );
    ids[ib.key] = result[0].id;
    console.log(`  Seeded inbound: ${ib.weegbonNr} (net: ${ib.netWeight}kg, value: €${totalInboundValue.toFixed(2)})`);
  }

  return ids as unknown as InboundIds;
}
