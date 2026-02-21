import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryPositions1708000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory_positions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "material_id" uuid NOT NULL REFERENCES "material_types"("id"),
        "location_id" uuid NOT NULL REFERENCES "yard_locations"("id"),
        "quantity_kg" integer NOT NULL DEFAULT 0,
        "avg_cost_eur_ton" decimal(12,2) NOT NULL DEFAULT 0,
        "total_cost_eur" decimal(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        UNIQUE ("material_id", "location_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inventory_positions";`);
  }
}
