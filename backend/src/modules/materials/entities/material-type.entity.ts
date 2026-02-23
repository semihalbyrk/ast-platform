import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WeightUom } from '../../../common/enums';
import { Contract } from '../../contracts/entities/contract.entity';

@Entity('material_types')
export class MaterialType extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: false })
  hazardous: boolean;

  @Column({ type: 'enum', enum: WeightUom, default: WeightUom.TON, name: 'weight_uom' })
  weightUom: WeightUom;

  @OneToMany(() => Contract, (c) => c.material)
  contracts: Contract[];
}
