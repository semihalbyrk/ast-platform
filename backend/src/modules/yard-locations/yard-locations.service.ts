import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { YardLocation } from './entities/yard-location.entity';
import { CreateYardLocationDto } from './dto/create-yard-location.dto';
import { UpdateYardLocationDto } from './dto/update-yard-location.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LocationType } from '../../common/enums';

@Injectable()
export class YardLocationsService {
  constructor(
    @InjectRepository(YardLocation)
    private readonly locationRepository: Repository<YardLocation>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filters?: { active?: boolean }) {
    const where: Record<string, unknown> = {};
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const [data, total] = await this.locationRepository.findAndCount({
      where,
      order: { code: 'ASC' },
    });
    return { data, meta: { total } };
  }

  async findOne(id: string) {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Yard location with id ${id} not found`);
    }
    return { data: location };
  }

  async create(dto: CreateYardLocationDto, userId: string) {
    if (dto.code) {
      const existing = await this.locationRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Yard location with code '${dto.code}' already exists`);
      }
    }

    const location = this.locationRepository.create({
      ...dto,
      type: LocationType.STORAGE_BAY,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.locationRepository.save(location);

    await this.auditLogService.log({
      entityType: 'yard_location',
      entityId: saved.id,
      action: 'create',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async update(id: string, dto: UpdateYardLocationDto, userId: string) {
    const existing = await this.locationRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Yard location with id ${id} not found`);
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.locationRepository.findOne({ where: { code: dto.code } });
      if (duplicate) {
        throw new ConflictException(`Yard location with code '${dto.code}' already exists`);
      }
    }

    const oldValue = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto, { updatedBy: userId });
    const saved = await this.locationRepository.save(existing);

    await this.auditLogService.log({
      entityType: 'yard_location',
      entityId: saved.id,
      action: 'update',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async remove(id: string, userId: string) {
    const existing = await this.locationRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Yard location with id ${id} not found`);
    }

    try {
      await this.locationRepository.delete(id);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new ConflictException('Yard location cannot be deleted because it is referenced by other records.');
      }
      throw err;
    }

    await this.auditLogService.log({
      entityType: 'yard_location',
      entityId: existing.id,
      action: 'delete',
      oldValue: existing as unknown as Record<string, unknown>,
      userId,
    });

    return { data: { id } };
  }
}
