import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MaterialType } from '../../materials/entities/material-type.entity';
import { YardLocation } from '../../yard-locations/entities/yard-location.entity';

@Entity('inventory_positions')
@Unique(['materialId', 'locationId'])
export class InventoryPosition extends BaseEntity {
  @ManyToOne(() => MaterialType)
  @JoinColumn({ name: 'material_id' })
  material: MaterialType;

  @Column({ type: 'uuid', name: 'material_id' })
  materialId: string;

  @ManyToOne(() => YardLocation, (l) => l.inventoryPositions)
  @JoinColumn({ name: 'location_id' })
  location: YardLocation;

  @Column({ type: 'uuid', name: 'location_id' })
  locationId: string;

  @Column({ type: 'integer', default: 0, name: 'quantity_kg' })
  quantityKg: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'avg_cost_eur_ton' })
  avgCostEurTon: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_cost_eur' })
  totalCostEur: number;
}
