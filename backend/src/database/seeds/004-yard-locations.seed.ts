import { QueryRunner } from 'typeorm';

export interface LocationIds {
  bay11: string;
  bayA1: string;
  dock1: string;
  dock2: string;
}

export async function seedYardLocations(queryRunner: QueryRunner): Promise<LocationIds> {
  const locations = [
    { key: 'bay11', code: '11', name: 'Storage Bay 11', type: 'storage_bay', capacity: 500 },
    { key: 'bayA1', code: 'A1', name: 'Storage Bay A1', type: 'storage_bay', capacity: 300 },
    { key: 'dock1', code: 'DOCK-1', name: 'Dock 1', type: 'dock', capacity: 1000 },
    { key: 'dock2', code: 'DOCK-2', name: 'Dock 2', type: 'dock', capacity: 1000 },
  ];

  const ids: Record<string, string> = {};

  for (const loc of locations) {
    const result = await queryRunner.query(
      `INSERT INTO "yard_locations" ("code", "name", "type", "capacity", "active")
       VALUES ($1, $2, $3::location_type_enum, $4, true)
       RETURNING "id"`,
      [loc.code, loc.name, loc.type, loc.capacity],
    );
    ids[loc.key] = result[0].id;
    console.log(`  Seeded location: ${loc.code} - ${loc.name}`);
  }

  return ids as unknown as LocationIds;
}
