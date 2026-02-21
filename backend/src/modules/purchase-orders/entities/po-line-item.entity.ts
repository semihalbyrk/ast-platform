import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LineType } from '../../../common/enums';
import { PurchaseOrder } from './purchase-order.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';

@Entity('po_line_items')
export class POLineItem extends BaseEntity {
  @ManyToOne(() => PurchaseOrder, (po) => po.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: 'uuid', name: 'po_id' })
  poId: string;

  @ManyToOne(() => Inbound, { nullable: true })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound | null;

  @Column({ type: 'uuid', nullable: true, name: 'inbound_id' })
  inboundId: string | null;

  @Column({ type: 'enum', enum: LineType, name: 'line_type' })
  lineType: LineType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'quantity_kg' })
  quantityKg: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'line_total' })
  lineTotal: number;
}
