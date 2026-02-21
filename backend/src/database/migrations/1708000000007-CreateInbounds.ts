import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInbounds1708000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "inbound_status_enum" AS ENUM (
        'weighed_in',
        'in_yard',
        'quality_checked',
        'weighed_out',
        'completed',
        'rejected'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "inbounds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "weegbon_nr" varchar(20) NOT NULL UNIQUE,
        "inbound_date" timestamptz NOT NULL,
        "vehicle_id" uuid REFERENCES "vehicles"("id"),
        "license_plate" varchar(20),
        "transporter_id" uuid REFERENCES "entities"("id"),
        "supplier_id" uuid NOT NULL REFERENCES "entities"("id"),
        "leverancier" varchar(100),
        "wtn_reference" varchar(100),
        "contract_id" uuid REFERENCES "contracts"("id"),
        "material_id" uuid NOT NULL REFERENCES "material_types"("id"),
        "price_per_ton" decimal(12,2),
        "gross_weight" integer,
        "gross_weight_at" timestamptz,
        "tare_weight" integer,
        "tare_weight_at" timestamptz,
        "net_weight" integer,
        "location_id" uuid REFERENCES "yard_locations"("id"),
        "hmsa_pct" decimal(5,2),
        "hmsb_pct" decimal(5,2),
        "imp_pct" decimal(5,2),
        "imp_weight" integer,
        "net_weight_after_imp" integer,
        "special_findings" jsonb,
        "quality_notes" text,
        "arrival_notes" text,
        "material_cost" decimal(12,2),
        "impurity_deduction" decimal(12,2),
        "total_inbound_value" decimal(12,2),
        "status" "inbound_status_enum" NOT NULL DEFAULT 'weighed_in',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_at" timestamptz
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inbounds";`);
    await queryRunner.query(`DROP TYPE "inbound_status_enum";`);
  }
}
