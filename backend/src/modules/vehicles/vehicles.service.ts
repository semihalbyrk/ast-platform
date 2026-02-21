import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filters?: { licensePlate?: string }) {
    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.transporter', 'transporter');

    if (filters?.licensePlate) {
      qb.andWhere('vehicle.license_plate ILIKE :plate', {
        plate: `%${filters.licensePlate}%`,
      });
    }

    qb.orderBy('vehicle.license_plate', 'ASC');

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total } };
  }

  async findOne(id: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['transporter'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }
    return { data: vehicle };
  }

  async findByPlate(licensePlate: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { licensePlate },
      relations: ['transporter'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with plate '${licensePlate}' not found`);
    }
    return { data: vehicle };
  }

  async create(dto: CreateVehicleDto, userId: string) {
    const existing = await this.vehicleRepository.findOne({
      where: { licensePlate: dto.licensePlate },
    });
    if (existing) {
      throw new ConflictException(`Vehicle with plate '${dto.licensePlate}' already exists`);
    }

    const vehicle = this.vehicleRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.vehicleRepository.save(vehicle);

    await this.auditLogService.log({
      entityType: 'vehicle',
      entityId: saved.id,
      action: 'create',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async update(id: string, dto: UpdateVehicleDto, userId: string) {
    const existing = await this.vehicleRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }

    if (dto.licensePlate && dto.licensePlate !== existing.licensePlate) {
      const duplicate = await this.vehicleRepository.findOne({
        where: { licensePlate: dto.licensePlate },
      });
      if (duplicate) {
        throw new ConflictException(`Vehicle with plate '${dto.licensePlate}' already exists`);
      }
    }

    const oldValue = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto, { updatedBy: userId });
    const saved = await this.vehicleRepository.save(existing);

    await this.auditLogService.log({
      entityType: 'vehicle',
      entityId: saved.id,
      action: 'update',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }
}
