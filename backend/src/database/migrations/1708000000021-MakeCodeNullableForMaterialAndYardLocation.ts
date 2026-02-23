import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCodeNullableForMaterialAndYardLocation1708000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "material_types"
      ALTER COLUMN "code" DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "yard_locations"
      ALTER COLUMN "code" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "material_types"
      SET "code" = CONCAT('MAT-', SUBSTRING(CAST("id" AS text), 1, 8))
      WHERE "code" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "yard_locations"
      SET "code" = CONCAT('YL-', SUBSTRING(CAST("id" AS text), 1, 8))
      WHERE "code" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "material_types"
      ALTER COLUMN "code" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "yard_locations"
      ALTER COLUMN "code" SET NOT NULL;
    `);
  }
}
