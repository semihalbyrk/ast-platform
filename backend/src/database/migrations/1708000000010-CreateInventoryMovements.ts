import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryMovements1708000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "movement_type_enum" AS ENUM (
        'inbound',
        'outbound',
        'adjustment'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "inbound_id" uuid REFERENCES "inbounds"("id"),
        "outbound_id" uuid,
        "material_id" uuid NOT NULL REFERENCES "material_types"("id"),
        "location_id" uuid NOT NULL REFERENCES "yard_locations"("id"),
        "type" "movement_type_enum" NOT NULL,
        "quantity_kg" integer NOT NULL,
        "cost_eur" decimal(12,2) NOT NULL,
        "reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inventory_movements";`);
    await queryRunner.query(`DROP TYPE "movement_type_enum";`);
  }
}
