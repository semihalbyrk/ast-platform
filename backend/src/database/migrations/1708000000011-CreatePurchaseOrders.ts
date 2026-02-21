import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrders1708000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "po_status_enum" AS ENUM (
        'draft',
        'approved',
        'sent',
        'accepted',
        'paid'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "po_number" varchar(50) NOT NULL UNIQUE,
        "supplier_id" uuid NOT NULL REFERENCES "entities"("id"),
        "contract_id" uuid REFERENCES "contracts"("id"),
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "issue_date" date NOT NULL,
        "payment_due_date" date,
        "status" "po_status_enum" NOT NULL DEFAULT 'draft',
        "total_excl_vat" decimal(12,2) NOT NULL DEFAULT 0,
        "vat" decimal(12,2) NOT NULL DEFAULT 0,
        "total_incl_vat" decimal(12,2) NOT NULL DEFAULT 0,
        "vat_code" varchar(10) NOT NULL DEFAULT '0',
        "pdf_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_at" timestamptz
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "purchase_orders";`);
    await queryRunner.query(`DROP TYPE "po_status_enum";`);
  }
}
