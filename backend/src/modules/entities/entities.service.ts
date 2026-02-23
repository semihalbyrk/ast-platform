import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityRecord } from './entities/entity.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EntityType } from '../../common/enums';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(EntityRecord)
    private readonly entityRepository: Repository<EntityRecord>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filters?: { type?: EntityType; active?: boolean }) {
    const qb = this.entityRepository.createQueryBuilder('entity');

    if (filters?.type) {
      qb.andWhere(':type = ANY(entity.type)', { type: filters.type });
    }
    if (filters?.active !== undefined) {
      qb.andWhere('entity.active = :active', { active: filters.active });
    }

    qb.orderBy('entity.name', 'ASC');

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total } };
  }

  async findOne(id: string) {
    const entity = await this.entityRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return { data: entity };
  }

  async create(dto: CreateEntityDto, userId: string) {
    const entity = this.entityRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.entityRepository.save(entity);

    await this.auditLogService.log({
      entityType: 'entity',
      entityId: saved.id,
      action: 'create',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async update(id: string, dto: UpdateEntityDto, userId: string) {
    const existing = await this.entityRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    const oldValue = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto, { updatedBy: userId });
    const saved = await this.entityRepository.save(existing);

    await this.auditLogService.log({
      entityType: 'entity',
      entityId: saved.id,
      action: 'update',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async remove(id: string, userId: string) {
    const existing = await this.entityRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    await this.entityRepository.softDelete(id);

    await this.auditLogService.log({
      entityType: 'entity',
      entityId: existing.id,
      action: 'delete',
      oldValue: existing as unknown as Record<string, unknown>,
      userId,
    });

    return { data: { id } };
  }
}
