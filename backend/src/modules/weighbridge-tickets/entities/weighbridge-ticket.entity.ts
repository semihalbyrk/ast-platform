import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';

@Entity('weighbridge_tickets')
export class WeighbridgeTicket extends BaseEntity {
  @OneToOne(() => Inbound, (i) => i.ticket)
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ type: 'uuid', unique: true, name: 'inbound_id' })
  inboundId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'ticket_number' })
  ticketNumber: string;

  @Column({ type: 'timestamptz', name: 'printed_at' })
  printedAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'pdf_url' })
  pdfUrl: string | null;
}
