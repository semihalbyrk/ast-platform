import { Entity, Column, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { EntityType } from '../../../common/enums';
import { Contract } from '../../contracts/entities/contract.entity';
import { Inbound } from '../../inbounds/entities/inbound.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('entities')
export class EntityRecord extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: EntityType, array: true })
  type: EntityType[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  street: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'postal_code' })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vat_nr' })
  vatNr: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  kvk: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  iban: string | null;

  @Column({ type: 'integer', nullable: true, name: 'payment_terms' })
  paymentTerms: number | null;

  @Column({ type: 'varchar', length: 10, default: 'EUR', name: 'default_currency' })
  defaultCurrency: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'contact_persons' })
  contactPersons: Array<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }> | null;

  @OneToMany(() => Contract, (c) => c.entity)
  contracts: Contract[];

  @OneToMany(() => Inbound, (i) => i.supplier)
  inbounds: Inbound[];

  @OneToMany(() => Vehicle, (v) => v.transporter)
  vehicles: Vehicle[];
}
