import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { InboundStatus } from '../../../common/enums';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { EntityRecord } from '../../entities/entities/entity.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { MaterialType } from '../../materials/entities/material-type.entity';
import { YardLocation } from '../../yard-locations/entities/yard-location.entity';
import { WeighbridgeTicket } from '../../weighbridge-tickets/entities/weighbridge-ticket.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';

@Entity('inbounds')
export class Inbound extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 20, unique: true, name: 'weegbon_nr' })
  weegbonNr: string;

  @Column({ type: 'timestamptz', name: 'inbound_date' })
  inboundDate: Date;

  @ManyToOne(() => Vehicle, (v) => v.inbounds, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle | null;

  @Column({ type: 'uuid', nullable: true, name: 'vehicle_id' })
  vehicleId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'license_plate' })
  licensePlate: string | null;

  @ManyToOne(() => EntityRecord, { nullable: true })
  @JoinColumn({ name: 'transporter_id' })
  transporter: EntityRecord | null;

  @Column({ type: 'uuid', nullable: true, name: 'transporter_id' })
  transporterId: string | null;

  @ManyToOne(() => EntityRecord, (e) => e.inbounds)
  @JoinColumn({ name: 'supplier_id' })
  supplier: EntityRecord;

  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  leverancier: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'wtn_reference' })
  wtnReference: string | null;

  @ManyToOne(() => Contract, (c) => c.inbounds, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract | null;

  @Column({ type: 'uuid', nullable: true, name: 'contract_id' })
  contractId: string | null;

  @ManyToOne(() => MaterialType)
  @JoinColumn({ name: 'material_id' })
  material: MaterialType;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'price_per_ton' })
  pricePerTon: number | null;

  // Weighing
  @Column({ type: 'integer', nullable: true, name: 'gross_weight' })
  grossWeight: number | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'gross_weight_at' })
  grossWeightAt: Date | null;

  @Column({ type: 'integer', nullable: true, name: 'tare_weight' })
  tareWeight: number | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'tare_weight_at' })
  tareWeightAt: Date | null;

  @Column({ type: 'integer', nullable: true, name: 'net_weight' })
  netWeight: number | null;

  // Quality
  @ManyToOne(() => YardLocation, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: YardLocation | null;

  @Column({ type: 'uuid', nullable: true, name: 'location_id' })
  locationId: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'hmsa_pct' })
  hmsaPct: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'hmsb_pct' })
  hmsbPct: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'imp_pct' })
  impPct: number | null;

  @Column({ type: 'integer', nullable: true, name: 'imp_weight' })
  impWeight: number | null;

  @Column({ type: 'integer', nullable: true, name: 'net_weight_after_imp' })
  netWeightAfterImp: number | null;

  // Special findings
  @Column({ type: 'jsonb', nullable: true, name: 'special_findings' })
  specialFindings: {
    accu?: { present: boolean; kg?: number };
    water?: { present: boolean; liters?: number };
    plastic?: { present: boolean; kg?: number };
    gasTubes?: { present: boolean; count?: number };
    other?: string;
  } | null;

  @Column({ type: 'text', nullable: true, name: 'quality_notes' })
  qualityNotes: string | null;

  @Column({ type: 'text', nullable: true, name: 'arrival_notes' })
  arrivalNotes: string | null;

  // Financial (calculated, stored)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'material_cost' })
  materialCost: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'impurity_deduction' })
  impurityDeduction: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_inbound_value' })
  totalInboundValue: number | null;

  @Column({ type: 'enum', enum: InboundStatus, default: InboundStatus.WEIGHED_IN })
  status: InboundStatus;

  @OneToOne(() => WeighbridgeTicket, (t) => t.inbound)
  ticket: WeighbridgeTicket;

  @OneToMany(() => InventoryMovement, (m) => m.inbound)
  inventoryMovements: InventoryMovement[];
}
