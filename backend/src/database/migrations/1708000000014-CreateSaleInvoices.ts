import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleInvoices1708000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sale_invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_number" varchar(50) NOT NULL UNIQUE,
        "sale_order_id" uuid NOT NULL REFERENCES "sale_orders"("id"),
        "invoice_date" date NOT NULL,
        "total_excl_vat" decimal(12,2) NOT NULL,
        "vat" decimal(12,2) NOT NULL,
        "total_incl_vat" decimal(12,2) NOT NULL,
        "status" "po_status_enum" NOT NULL DEFAULT 'draft',
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
    await queryRunner.query(`DROP TABLE "sale_invoices";`);
  }
}
