import { QueryRunner } from 'typeorm';
import { EntityIds } from './002-entities.seed';
import { MaterialIds } from './003-materials.seed';

export interface ContractIds {
  emsschrottRebar: string;
  berkHms12: string;
}

export async function seedContracts(
  queryRunner: QueryRunner,
  entityIds: EntityIds,
  materialIds: MaterialIds,
): Promise<ContractIds> {
  const contracts = [
    {
      key: 'emsschrottRebar',
      number: '2299700',
      type: 'inkoop',
      status: 'lopend',
      entityId: entityIds.emsschrott,
      materialId: materialIds.rebar,
      price: 175.00,
      impDeduction: 0,
      agreedVolume: 150000,
      startDate: '2025-10-14',
      endDate: '2025-12-04',
      paymentTerms: 7,
      termsOfDelivery: 'Free Delivered Amsterdam',
    },
    {
      key: 'berkHms12',
      number: '2299800',
      type: 'inkoop',
      status: 'lopend',
      entityId: entityIds.berk,
      materialId: materialIds.hms12,
      price: 180.00,
      impDeduction: 150.00,
      agreedVolume: 200000,
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      paymentTerms: 7,
      termsOfDelivery: 'Free Delivered Amsterdam',
    },
  ];

  const ids: Record<string, string> = {};

  for (const c of contracts) {
    const result = await queryRunner.query(
      `INSERT INTO "contracts" (
        "number", "type", "status", "entity_id", "material_id",
        "price", "imp_deduction", "agreed_volume",
        "start_date", "end_date", "payment_terms", "terms_of_delivery"
      ) VALUES (
        $1, $2::contract_type_enum, $3::contract_status_enum, $4, $5,
        $6, $7, $8, $9, $10, $11, $12
      ) RETURNING "id"`,
      [
        c.number, c.type, c.status, c.entityId, c.materialId,
        c.price, c.impDeduction, c.agreedVolume,
        c.startDate, c.endDate, c.paymentTerms, c.termsOfDelivery,
      ],
    );
    ids[c.key] = result[0].id;
    console.log(`  Seeded contract: ${c.number} (${c.type})`);
  }

  return ids as unknown as ContractIds;
}
