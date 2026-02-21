import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexes1708000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Entities
    await queryRunner.query(`CREATE INDEX "idx_entities_type" ON "entities" USING GIN ("type");`);
    await queryRunner.query(`CREATE INDEX "idx_entities_vat_nr" ON "entities" ("vat_nr");`);
    await queryRunner.query(`CREATE INDEX "idx_entities_active" ON "entities" ("active");`);

    // Vehicles
    await queryRunner.query(`CREATE INDEX "idx_vehicles_transporter_id" ON "vehicles" ("transporter_id");`);

    // Contracts
    await queryRunner.query(`CREATE INDEX "idx_contracts_entity_id" ON "contracts" ("entity_id");`);
    await queryRunner.query(`CREATE INDEX "idx_contracts_material_id" ON "contracts" ("material_id");`);
    await queryRunner.query(`CREATE INDEX "idx_contracts_status" ON "contracts" ("status");`);

    // Inbounds
    await queryRunner.query(`CREATE INDEX "idx_inbounds_supplier_id" ON "inbounds" ("supplier_id");`);
    await queryRunner.query(`CREATE INDEX "idx_inbounds_contract_id" ON "inbounds" ("contract_id");`);
    await queryRunner.query(`CREATE INDEX "idx_inbounds_material_id" ON "inbounds" ("material_id");`);
    await queryRunner.query(`CREATE INDEX "idx_inbounds_status" ON "inbounds" ("status");`);
    await queryRunner.query(`CREATE INDEX "idx_inbounds_inbound_date" ON "inbounds" ("inbound_date");`);
    await queryRunner.query(`CREATE INDEX "idx_inbounds_location_id" ON "inbounds" ("location_id");`);

    // Inventory movements
    await queryRunner.query(`CREATE INDEX "idx_inv_movements_inbound_id" ON "inventory_movements" ("inbound_id");`);
    await queryRunner.query(`CREATE INDEX "idx_inv_movements_material_id" ON "inventory_movements" ("material_id");`);
    await queryRunner.query(`CREATE INDEX "idx_inv_movements_type" ON "inventory_movements" ("type");`);

    // Purchase orders
    await queryRunner.query(`CREATE INDEX "idx_po_supplier_id" ON "purchase_orders" ("supplier_id");`);
    await queryRunner.query(`CREATE INDEX "idx_po_status" ON "purchase_orders" ("status");`);
    await queryRunner.query(`CREATE INDEX "idx_po_contract_id" ON "purchase_orders" ("contract_id");`);

    // PO line items
    await queryRunner.query(`CREATE INDEX "idx_po_line_items_po_id" ON "po_line_items" ("po_id");`);
    await queryRunner.query(`CREATE INDEX "idx_po_line_items_inbound_id" ON "po_line_items" ("inbound_id");`);

    // Documents (polymorphic)
    await queryRunner.query(`CREATE INDEX "idx_documents_parent" ON "documents" ("parent_type", "parent_id");`);

    // Audit logs
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" ("timestamp");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_audit_logs_timestamp";`);
    await queryRunner.query(`DROP INDEX "idx_audit_logs_user_id";`);
    await queryRunner.query(`DROP INDEX "idx_audit_logs_entity";`);
    await queryRunner.query(`DROP INDEX "idx_documents_parent";`);
    await queryRunner.query(`DROP INDEX "idx_po_line_items_inbound_id";`);
    await queryRunner.query(`DROP INDEX "idx_po_line_items_po_id";`);
    await queryRunner.query(`DROP INDEX "idx_po_contract_id";`);
    await queryRunner.query(`DROP INDEX "idx_po_status";`);
    await queryRunner.query(`DROP INDEX "idx_po_supplier_id";`);
    await queryRunner.query(`DROP INDEX "idx_inv_movements_type";`);
    await queryRunner.query(`DROP INDEX "idx_inv_movements_material_id";`);
    await queryRunner.query(`DROP INDEX "idx_inv_movements_inbound_id";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_location_id";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_inbound_date";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_status";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_material_id";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_contract_id";`);
    await queryRunner.query(`DROP INDEX "idx_inbounds_supplier_id";`);
    await queryRunner.query(`DROP INDEX "idx_contracts_status";`);
    await queryRunner.query(`DROP INDEX "idx_contracts_material_id";`);
    await queryRunner.query(`DROP INDEX "idx_contracts_entity_id";`);
    await queryRunner.query(`DROP INDEX "idx_vehicles_transporter_id";`);
    await queryRunner.query(`DROP INDEX "idx_entities_active";`);
    await queryRunner.query(`DROP INDEX "idx_entities_vat_nr";`);
    await queryRunner.query(`DROP INDEX "idx_entities_type";`);
  }
}
