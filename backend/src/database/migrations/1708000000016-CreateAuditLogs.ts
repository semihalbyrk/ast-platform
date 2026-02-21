import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1708000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "action" varchar(50) NOT NULL,
        "old_value" jsonb,
        "new_value" jsonb,
        "user_id" uuid,
        "timestamp" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs";`);
  }
}
