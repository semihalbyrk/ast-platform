import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleOrders1708000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "sale_order_status_enum" AS ENUM (
        'draft',
        'confirmed',
        'shipped',
        'invoiced',
        'paid'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "sale_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order_number" varchar(50) NOT NULL UNIQUE,
        "buyer_id" uuid NOT NULL REFERENCES "entities"("id"),
        "material_id" uuid NOT NULL REFERENCES "material_types"("id"),
        "quantity_kg" integer NOT NULL,
        "unit_price" decimal(12,2) NOT NULL,
        "shipment_date" date,
        "vessel_reference" varchar(255),
        "status" "sale_order_status_enum" NOT NULL DEFAULT 'draft',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_at" timestamptz
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sale_orders";`);
    await queryRunner.query(`DROP TYPE "sale_order_status_enum";`);
  }
}
