import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateYardLocations1708000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "location_type_enum" AS ENUM (
        'storage_bay',
        'dock',
        'processing_area'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "yard_locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(20) NOT NULL UNIQUE,
        "name" varchar(255) NOT NULL,
        "type" "location_type_enum" NOT NULL,
        "capacity" integer,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "yard_locations";`);
    await queryRunner.query(`DROP TYPE "location_type_enum";`);
  }
}
