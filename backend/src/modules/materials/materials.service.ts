import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaterialType } from './entities/material-type.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(MaterialType)
    private readonly materialRepository: Repository<MaterialType>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filters?: { active?: boolean }) {
    const where: Record<string, unknown> = {};
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const [data, total] = await this.materialRepository.findAndCount({
      where,
      order: { code: 'ASC' },
    });
    return { data, meta: { total } };
  }

  async findOne(id: string) {
    const material = await this.materialRepository.findOne({ where: { id } });
    if (!material) {
      throw new NotFoundException(`Material with id ${id} not found`);
    }
    return { data: material };
  }

  async create(dto: CreateMaterialDto, userId: string) {
    const existing = await this.materialRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Material with code '${dto.code}' already exists`);
    }

    const material = this.materialRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.materialRepository.save(material);

    await this.auditLogService.log({
      entityType: 'material_type',
      entityId: saved.id,
      action: 'create',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async update(id: string, dto: UpdateMaterialDto, userId: string) {
    const existing = await this.materialRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Material with id ${id} not found`);
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.materialRepository.findOne({ where: { code: dto.code } });
      if (duplicate) {
        throw new ConflictException(`Material with code '${dto.code}' already exists`);
      }
    }

    const oldValue = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto, { updatedBy: userId });
    const saved = await this.materialRepository.save(existing);

    await this.auditLogService.log({
      entityType: 'material_type',
      entityId: saved.id,
      action: 'update',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }
}
