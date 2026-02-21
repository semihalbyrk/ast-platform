import { QueryRunner } from 'typeorm';

export interface MaterialIds {
  hms12: string;
  hmsV2: string;
  rebar: string;
}

export async function seedMaterials(queryRunner: QueryRunner): Promise<MaterialIds> {
  const materials = [
    { key: 'hms12', code: 'HMS12', name: 'HMS 1/2', nameNl: 'Heavy Melting Scrap 1/2', category: 'ferrous' },
    { key: 'hmsV2', code: 'HMS-V2', name: 'HMS V2', nameNl: 'HMS V2', category: 'ferrous' },
    { key: 'rebar', code: 'REBAR', name: 'Rebars', nameNl: 'Betonstaal', category: 'ferrous' },
  ];

  const ids: Record<string, string> = {};

  for (const mat of materials) {
    const result = await queryRunner.query(
      `INSERT INTO "material_types" ("code", "name", "name_nl", "category", "unit", "active")
       VALUES ($1, $2, $3, $4::material_category_enum, 'ton', true)
       RETURNING "id"`,
      [mat.code, mat.name, mat.nameNl, mat.category],
    );
    ids[mat.key] = result[0].id;
    console.log(`  Seeded material: ${mat.code} - ${mat.name}`);
  }

  return ids as unknown as MaterialIds;
}
