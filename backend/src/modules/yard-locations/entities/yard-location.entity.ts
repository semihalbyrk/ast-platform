import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocationType } from '../../../common/enums';
import { InventoryPosition } from '../../inventory/entities/inventory-position.entity';

@Entity('yard_locations')
export class YardLocation extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: LocationType })
  type: LocationType;

  @Column({ type: 'integer', nullable: true })
  capacity: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => InventoryPosition, (ip) => ip.location)
  inventoryPositions: InventoryPosition[];
}
