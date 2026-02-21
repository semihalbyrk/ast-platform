import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePOLineItems1708000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "line_type_enum" AS ENUM ('material', 'impurity');
    `);

    await queryRunner.query(`
      CREATE TABLE "po_line_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "po_id" uuid NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
        "inbound_id" uuid REFERENCES "inbounds"("id"),
        "line_type" "line_type_enum" NOT NULL,
        "description" varchar(255),
        "quantity_kg" decimal(12,3) NOT NULL,
        "unit_price" decimal(12,2) NOT NULL,
        "line_total" decimal(12,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "po_line_items";`);
    await queryRunner.query(`DROP TYPE "line_type_enum";`);
  }
}
