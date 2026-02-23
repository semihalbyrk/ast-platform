import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { POStatus } from '../../../common/enums';
import { EntityRecord } from '../../entities/entities/entity.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { POLineItem } from './po-line-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'po_number' })
  poNumber: string;

  @ManyToOne(() => EntityRecord)
  @JoinColumn({ name: 'supplier_id' })
  client: EntityRecord;

  @Column({ type: 'uuid', name: 'supplier_id' })
  clientId: string;

  @ManyToOne(() => Contract, (c) => c.purchaseOrders, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract | null;

  @Column({ type: 'uuid', nullable: true, name: 'contract_id' })
  contractId: string | null;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: Date;

  @Column({ type: 'date', name: 'period_end' })
  periodEnd: Date;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true, name: 'payment_due_date' })
  paymentDueDate: Date | null;

  @Column({ type: 'enum', enum: POStatus, default: POStatus.READY })
  status: POStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_excl_vat' })
  totalExclVat: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  vat: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_incl_vat' })
  totalInclVat: number;

  @Column({ type: 'varchar', length: 10, default: '0', name: 'vat_code' })
  vatCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'pdf_url' })
  pdfUrl: string | null;

  @OneToMany(() => POLineItem, (li) => li.purchaseOrder, { cascade: true })
  lineItems: POLineItem[];
}
