import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntities1708000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "entity_type_enum" AS ENUM (
        'supplier',
        'buyer',
        'transporter',
        'internal'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "entities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "type" "entity_type_enum"[] NOT NULL,
        "street" varchar(255),
        "city" varchar(255),
        "postal_code" varchar(20),
        "country" varchar(100),
        "vat_nr" varchar(50),
        "kvk" varchar(50),
        "iban" varchar(50),
        "payment_terms" integer,
        "default_currency" varchar(10) NOT NULL DEFAULT 'EUR',
        "notes" text,
        "active" boolean NOT NULL DEFAULT true,
        "contact_persons" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_at" timestamptz
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "entities";`);
    await queryRunner.query(`DROP TYPE "entity_type_enum";`);
  }
}
