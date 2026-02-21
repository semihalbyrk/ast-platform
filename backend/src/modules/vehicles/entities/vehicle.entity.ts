import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VehicleType } from '../../../common/enums';
import { EntityRecord } from '../../entities/entities/entity.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, name: 'license_plate' })
  licensePlate: string;

  @Column({ type: 'enum', enum: VehicleType })
  type: VehicleType;

  @ManyToOne(() => EntityRecord, (e) => e.vehicles, { nullable: true })
  @JoinColumn({ name: 'transporter_id' })
  transporter: EntityRecord | null;

  @Column({ type: 'uuid', nullable: true, name: 'transporter_id' })
  transporterId: string | null;

  @Column({ type: 'integer', nullable: true, name: 'tare_weight' })
  tareWeight: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => Inbound, (i) => i.vehicle)
  inbounds: Inbound[];
}
