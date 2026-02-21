import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MovementType } from '../../../common/enums';
import { Inbound } from '../../inbounds/entities/inbound.entity';
import { MaterialType } from '../../materials/entities/material-type.entity';
import { YardLocation } from '../../yard-locations/entities/yard-location.entity';

@Entity('inventory_movements')
export class InventoryMovement extends BaseEntity {
  @ManyToOne(() => Inbound, (i) => i.inventoryMovements, { nullable: true })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound | null;

  @Column({ type: 'uuid', nullable: true, name: 'inbound_id' })
  inboundId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'outbound_id' })
  outboundId: string | null;

  @ManyToOne(() => MaterialType)
  @JoinColumn({ name: 'material_id' })
  material: MaterialType;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @ManyToOne(() => YardLocation)
  @JoinColumn({ name: 'location_id' })
  location: YardLocation;

  @Column({ type: 'uuid', name: 'location_id' })
  locationId: string;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'integer', name: 'quantity_kg' })
  quantityKg: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_eur' })
  costEur: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
