import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientTypeAndFreights1708000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'entity_type_enum' AND e.enumlabel = 'client'
        ) THEN
          ALTER TYPE "entity_type_enum" ADD VALUE 'client';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "contracts"
      ADD COLUMN IF NOT EXISTS "freights" decimal(12,2);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contracts"
      DROP COLUMN IF EXISTS "freights";
    `);
  }
}
