import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { POStatus } from '../../../common/enums';
import { SaleOrder } from './sale-order.entity';

@Entity('sale_invoices')
export class SaleInvoice extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_number' })
  invoiceNumber: string;

  @ManyToOne(() => SaleOrder, (so) => so.invoices)
  @JoinColumn({ name: 'sale_order_id' })
  saleOrder: SaleOrder;

  @Column({ type: 'uuid', name: 'sale_order_id' })
  saleOrderId: string;

  @Column({ type: 'date', name: 'invoice_date' })
  invoiceDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_excl_vat' })
  totalExclVat: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  vat: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_incl_vat' })
  totalInclVat: number;

  @Column({ type: 'enum', enum: POStatus, default: POStatus.READY })
  status: POStatus;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'pdf_url' })
  pdfUrl: string | null;
}
