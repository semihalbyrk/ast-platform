import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMaterialSchema1708000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weight_uom_enum') THEN
          CREATE TYPE "weight_uom_enum" AS ENUM ('ton', 'lbs', 'lt');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "material_types"
      ADD COLUMN IF NOT EXISTS "hazardous" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "material_types"
      ADD COLUMN IF NOT EXISTS "weight_uom" "weight_uom_enum" NOT NULL DEFAULT 'ton';
    `);

    await queryRunner.query(`
      UPDATE "material_types"
      SET "weight_uom" =
        CASE LOWER(COALESCE("unit", 'ton'))
          WHEN 'lbs' THEN 'lbs'::"weight_uom_enum"
          WHEN 'lt' THEN 'lt'::"weight_uom_enum"
          ELSE 'ton'::"weight_uom_enum"
        END;
    `);

    await queryRunner.query(`
      ALTER TABLE "material_types"
      ALTER COLUMN "category" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "material_types"
      DROP COLUMN IF EXISTS "weight_uom";
    `);

    await queryRunner.query(`
      ALTER TABLE "material_types"
      DROP COLUMN IF EXISTS "hazardous";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "weight_uom_enum";
    `);
  }
}
