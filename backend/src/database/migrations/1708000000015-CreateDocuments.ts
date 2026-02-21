import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocuments1708000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM (
        'wtn',
        'annex7',
        'contract',
        'weighbridge_ticket',
        'purchase_invoice',
        'sale_invoice',
        'quality_photo',
        'other'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "parent_type" varchar(50) NOT NULL,
        "parent_id" uuid NOT NULL,
        "document_type" "document_type_enum" NOT NULL,
        "filename" varchar(255) NOT NULL,
        "file_url" varchar(500) NOT NULL,
        "mime_type" varchar(100),
        "file_size" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "documents";`);
    await queryRunner.query(`DROP TYPE "document_type_enum";`);
  }
}
