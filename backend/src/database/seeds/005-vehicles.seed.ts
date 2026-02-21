import { QueryRunner } from 'typeorm';
import { EntityIds } from './002-entities.seed';

export interface VehicleIds {
  truck1: string;
  truck2: string;
  truck3: string;
  truck4: string;
}

export async function seedVehicles(
  queryRunner: QueryRunner,
  entityIds: EntityIds,
): Promise<VehicleIds> {
  const vehicles = [
    { key: 'truck1', plate: 'KLE-BR-101', tare: 14000, transporterId: entityIds.berk },
    { key: 'truck2', plate: 'KLE-BR-102', tare: 13500, transporterId: entityIds.berk },
    { key: 'truck3', plate: 'EMS-SC-201', tare: 14200, transporterId: entityIds.emsschrott },
    { key: 'truck4', plate: 'EMS-SC-202', tare: 13800, transporterId: entityIds.emsschrott },
  ];

  const ids: Record<string, string> = {};

  for (const v of vehicles) {
    const result = await queryRunner.query(
      `INSERT INTO "vehicles" ("license_plate", "type", "transporter_id", "tare_weight")
       VALUES ($1, 'truck'::vehicle_type_enum, $2, $3)
       RETURNING "id"`,
      [v.plate, v.transporterId, v.tare],
    );
    ids[v.key] = result[0].id;
    console.log(`  Seeded vehicle: ${v.plate}`);
  }

  return ids as unknown as VehicleIds;
}
