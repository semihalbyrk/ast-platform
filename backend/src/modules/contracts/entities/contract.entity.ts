import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { ContractType, ContractStatus } from '../../../common/enums';
import { EntityRecord } from '../../entities/entities/entity.entity';
import { MaterialType } from '../../materials/entities/material-type.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';

@Entity('contracts')
export class Contract extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  number: string;

  @Column({ type: 'enum', enum: ContractType })
  type: ContractType;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.CONCEPT })
  status: ContractStatus;

  @ManyToOne(() => EntityRecord, (e) => e.contracts)
  @JoinColumn({ name: 'entity_id' })
  entity: EntityRecord;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @ManyToOne(() => EntityRecord, { nullable: true })
  @JoinColumn({ name: 'laden_lossen_id' })
  ladenLossen: EntityRecord | null;

  @Column({ type: 'uuid', nullable: true, name: 'laden_lossen_id' })
  ladenLossenId: string | null;

  @ManyToOne(() => MaterialType, (m) => m.contracts)
  @JoinColumn({ name: 'material_id' })
  material: MaterialType;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'imp_deduction' })
  impDeduction: number;

  @Column({ type: 'integer', name: 'agreed_volume' })
  agreedVolume: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'integer', nullable: true, name: 'payment_terms' })
  paymentTerms: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'terms_of_delivery' })
  termsOfDelivery: string | null;

  @Column({ type: 'integer', nullable: true, name: 'max_truckloads' })
  maxTruckloads: number | null;

  @Column({ type: 'integer', nullable: true, name: 'std_gewicht' })
  stdGewicht: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => Inbound, (i) => i.contract)
  inbounds: Inbound[];

  @OneToMany(() => PurchaseOrder, (po) => po.contract)
  purchaseOrders: PurchaseOrder[];
}
