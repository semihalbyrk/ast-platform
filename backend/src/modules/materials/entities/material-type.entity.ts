import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MaterialCategory } from '../../../common/enums';
import { Contract } from '../../contracts/entities/contract.entity';

@Entity('material_types')
export class MaterialType extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'name_nl' })
  nameNl: string | null;

  @Column({ type: 'enum', enum: MaterialCategory })
  category: MaterialCategory;

  @Column({ type: 'varchar', length: 10, default: 'ton' })
  unit: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => Contract, (c) => c.material)
  contracts: Contract[];
}
