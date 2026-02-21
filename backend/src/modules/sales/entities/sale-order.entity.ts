import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { SaleOrderStatus } from '../../../common/enums';
import { EntityRecord } from '../../entities/entities/entity.entity';
import { MaterialType } from '../../materials/entities/material-type.entity';
import { SaleInvoice } from './sale-invoice.entity';

@Entity('sale_orders')
export class SaleOrder extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'order_number' })
  orderNumber: string;

  @ManyToOne(() => EntityRecord)
  @JoinColumn({ name: 'buyer_id' })
  buyer: EntityRecord;

  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => MaterialType)
  @JoinColumn({ name: 'material_id' })
  material: MaterialType;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @Column({ type: 'integer', name: 'quantity_kg' })
  quantityKg: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'date', nullable: true, name: 'shipment_date' })
  shipmentDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'vessel_reference' })
  vesselReference: string | null;

  @Column({ type: 'enum', enum: SaleOrderStatus, default: SaleOrderStatus.DRAFT })
  status: SaleOrderStatus;

  @OneToMany(() => SaleInvoice, (si) => si.saleOrder)
  invoices: SaleInvoice[];
}
