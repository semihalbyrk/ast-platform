import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeighbridgeTickets1708000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "weighbridge_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "inbound_id" uuid NOT NULL UNIQUE REFERENCES "inbounds"("id"),
        "ticket_number" varchar(50) NOT NULL UNIQUE,
        "printed_at" timestamptz NOT NULL,
        "pdf_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "weighbridge_tickets";`);
  }
}
