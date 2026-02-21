import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContracts1708000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contract_type_enum" AS ENUM ('inkoop', 'verkoop');
    `);

    await queryRunner.query(`
      CREATE TYPE "contract_status_enum" AS ENUM ('concept', 'lopend', 'gesloten');
    `);

    await queryRunner.query(`
      CREATE TABLE "contracts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "number" varchar(50) NOT NULL UNIQUE,
        "type" "contract_type_enum" NOT NULL,
        "status" "contract_status_enum" NOT NULL DEFAULT 'concept',
        "entity_id" uuid NOT NULL REFERENCES "entities"("id"),
        "laden_lossen_id" uuid REFERENCES "entities"("id"),
        "material_id" uuid NOT NULL REFERENCES "material_types"("id"),
        "price" decimal(12,2) NOT NULL,
        "imp_deduction" decimal(12,2) NOT NULL DEFAULT 0,
        "agreed_volume" integer NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "payment_terms" integer,
        "terms_of_delivery" varchar(255),
        "max_truckloads" integer,
        "std_gewicht" integer,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        "deleted_at" timestamptz
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "contracts";`);
    await queryRunner.query(`DROP TYPE "contract_status_enum";`);
    await queryRunner.query(`DROP TYPE "contract_type_enum";`);
  }
}
