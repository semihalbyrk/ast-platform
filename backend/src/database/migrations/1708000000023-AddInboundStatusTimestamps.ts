import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInboundStatusTimestamps1708000000023 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inbounds"
      ADD COLUMN "quality_checked_at" timestamptz,
      ADD COLUMN "weighed_out_at" timestamptz,
      ADD COLUMN "completed_at" timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inbounds"
      DROP COLUMN "completed_at",
      DROP COLUMN "weighed_out_at",
      DROP COLUMN "quality_checked_at";
    `);
  }
}
