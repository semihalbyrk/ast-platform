import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaterialTypes1708000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "material_category_enum" AS ENUM (
        'ferrous',
        'non_ferrous',
        'mixed'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "material_types" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(20) NOT NULL UNIQUE,
        "name" varchar(255) NOT NULL,
        "name_nl" varchar(255),
        "category" "material_category_enum" NOT NULL,
        "unit" varchar(10) NOT NULL DEFAULT 'ton',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "material_types";`);
    await queryRunner.query(`DROP TYPE "material_category_enum";`);
  }
}
