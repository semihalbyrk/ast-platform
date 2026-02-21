import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicles1708000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "vehicle_type_enum" AS ENUM (
        'truck',
        'barge',
        'other'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "license_plate" varchar(20) NOT NULL UNIQUE,
        "type" "vehicle_type_enum" NOT NULL,
        "transporter_id" uuid REFERENCES "entities"("id"),
        "tare_weight" integer,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vehicles";`);
    await queryRunner.query(`DROP TYPE "vehicle_type_enum";`);
  }
}
