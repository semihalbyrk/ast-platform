import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientToContracts1708000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contracts"
      ADD COLUMN "client_id" uuid REFERENCES "entities"("id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contracts"
      DROP COLUMN "client_id";
    `);
  }
}
