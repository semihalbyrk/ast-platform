import { QueryRunner } from 'typeorm';

export interface EntityIds {
  ast: string;
  berk: string;
  emsschrott: string;
  derk: string;
}

export async function seedEntities(queryRunner: QueryRunner): Promise<EntityIds> {
  const entities = [
    {
      key: 'ast',
      name: 'Amsterdam Scrap Terminal B.V.',
      type: '{internal}',
      street: 'Vlothavenweg 1',
      city: 'Amsterdam',
      postal_code: '1013 BJ',
      country: 'Netherlands',
      vat_nr: 'NL856875983B01',
      kvk: '67207405',
      iban: 'NL76UGBI0709898894',
      payment_terms: null,
      contact_persons: JSON.stringify([
        { name: 'AST Office', email: 'info@ast.nl', phone: '+31(0)20 705 2333', role: 'General' },
      ]),
    },
    {
      key: 'berk',
      name: 'Berk Recycling GmbH',
      type: '{supplier}',
      street: 'Velder Dyck 21',
      city: 'Kevelaer',
      postal_code: 'DE 47624',
      country: 'Germany',
      vat_nr: 'DE360429848',
      kvk: null,
      iban: null,
      payment_terms: 7,
      contact_persons: null,
    },
    {
      key: 'emsschrott',
      name: 'Emsschrott GmbH & Co. KG',
      type: '{supplier,transporter}',
      street: null,
      city: null,
      postal_code: null,
      country: 'Germany',
      vat_nr: null,
      kvk: null,
      iban: null,
      payment_terms: 7,
      contact_persons: null,
    },
    {
      key: 'derk',
      name: 'Derk Recycling GmbH',
      type: '{supplier}',
      street: null,
      city: null,
      postal_code: null,
      country: 'Germany',
      vat_nr: null,
      kvk: null,
      iban: null,
      payment_terms: 7,
      contact_persons: null,
    },
  ];

  const ids: Record<string, string> = {};

  for (const entity of entities) {
    const result = await queryRunner.query(
      `INSERT INTO "entities" (
        "name", "type", "street", "city", "postal_code", "country",
        "vat_nr", "kvk", "iban", "payment_terms", "contact_persons", "active"
      ) VALUES ($1, $2::entity_type_enum[], $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true)
      RETURNING "id"`,
      [
        entity.name,
        entity.type,
        entity.street,
        entity.city,
        entity.postal_code,
        entity.country,
        entity.vat_nr,
        entity.kvk,
        entity.iban,
        entity.payment_terms,
        entity.contact_persons,
      ],
    );
    ids[entity.key] = result[0].id;
    console.log(`  Seeded entity: ${entity.name}`);
  }

  return ids as unknown as EntityIds;
}
