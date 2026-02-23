import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyPOStatusToReadyPaidRejected1708000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "po_status_enum_new" AS ENUM ('ready', 'paid', 'rejected');
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" TYPE "po_status_enum_new"
      USING (
        CASE
          WHEN status::text = 'paid' THEN 'paid'::po_status_enum_new
          WHEN status::text = 'rejected' THEN 'rejected'::po_status_enum_new
          ELSE 'ready'::po_status_enum_new
        END
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" SET DEFAULT 'ready';
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" TYPE "po_status_enum_new"
      USING (
        CASE
          WHEN status::text = 'paid' THEN 'paid'::po_status_enum_new
          WHEN status::text = 'rejected' THEN 'rejected'::po_status_enum_new
          ELSE 'ready'::po_status_enum_new
        END
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" SET DEFAULT 'ready';
    `);

    await queryRunner.query(`DROP TYPE "po_status_enum";`);
    await queryRunner.query(`ALTER TYPE "po_status_enum_new" RENAME TO "po_status_enum";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "po_status_enum_old" AS ENUM ('draft', 'approved', 'sent', 'accepted', 'paid');
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" TYPE "po_status_enum_old"
      USING (
        CASE
          WHEN status::text = 'paid' THEN 'paid'::po_status_enum_old
          WHEN status::text = 'rejected' THEN 'draft'::po_status_enum_old
          ELSE 'approved'::po_status_enum_old
        END
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ALTER COLUMN "status" SET DEFAULT 'draft';
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" TYPE "po_status_enum_old"
      USING (
        CASE
          WHEN status::text = 'paid' THEN 'paid'::po_status_enum_old
          WHEN status::text = 'rejected' THEN 'draft'::po_status_enum_old
          ELSE 'approved'::po_status_enum_old
        END
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_invoices"
      ALTER COLUMN "status" SET DEFAULT 'draft';
    `);

    await queryRunner.query(`DROP TYPE "po_status_enum";`);
    await queryRunner.query(`ALTER TYPE "po_status_enum_old" RENAME TO "po_status_enum";`);
  }
}
