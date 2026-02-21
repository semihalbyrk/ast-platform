import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ContractStatus, InboundStatus } from '../../common/enums';

export interface ContractWithCalculations extends Contract {
  processedWeight: number;
  linkedWeight: number;
  remainingVolume: number;
  utilizationPct: number;
  daysRemaining: number;
}

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(filters?: { status?: ContractStatus; includeGesloten?: boolean }) {
    const qb = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.entity', 'entity')
      .leftJoinAndSelect('contract.material', 'material')
      .leftJoinAndSelect('contract.ladenLossen', 'ladenLossen')
      .leftJoin('contract.inbounds', 'inbound_completed', 'inbound_completed.status = :completedStatus', {
        completedStatus: InboundStatus.COMPLETED,
      })
      .addSelect('COALESCE(SUM(inbound_completed.net_weight_after_imp), 0)', 'processed_weight')
      .leftJoin('contract.inbounds', 'inbound_linked', 'inbound_linked.status IN (:...linkedStatuses)', {
        linkedStatuses: [InboundStatus.WEIGHED_IN, InboundStatus.IN_YARD],
      })
      .addSelect('COALESCE(SUM(inbound_linked.net_weight), 0)', 'linked_weight')
      .groupBy('contract.id')
      .addGroupBy('entity.id')
      .addGroupBy('material.id')
      .addGroupBy('ladenLossen.id');

    if (filters?.status) {
      qb.andWhere('contract.status = :status', { status: filters.status });
    } else if (!filters?.includeGesloten) {
      qb.andWhere('contract.status != :gesloten', { gesloten: ContractStatus.GESLOTEN });
    }

    qb.orderBy('contract.number', 'ASC');

    const rawResults = await qb.getRawAndEntities();
    const contracts = rawResults.entities.map((contract, idx) => {
      const raw = rawResults.raw[idx];
      return this.attachCalculations(contract, raw);
    });

    return { data: contracts, meta: { total: contracts.length } };
  }

  async findOne(id: string) {
    const qb = this.contractRepository
      .createQueryBuilder('contract')
      .leftJoinAndSelect('contract.entity', 'entity')
      .leftJoinAndSelect('contract.material', 'material')
      .leftJoinAndSelect('contract.ladenLossen', 'ladenLossen')
      .leftJoin('contract.inbounds', 'inbound_completed', 'inbound_completed.status = :completedStatus', {
        completedStatus: InboundStatus.COMPLETED,
      })
      .addSelect('COALESCE(SUM(inbound_completed.net_weight_after_imp), 0)', 'processed_weight')
      .leftJoin('contract.inbounds', 'inbound_linked', 'inbound_linked.status IN (:...linkedStatuses)', {
        linkedStatuses: [InboundStatus.WEIGHED_IN, InboundStatus.IN_YARD],
      })
      .addSelect('COALESCE(SUM(inbound_linked.net_weight), 0)', 'linked_weight')
      .where('contract.id = :id', { id })
      .groupBy('contract.id')
      .addGroupBy('entity.id')
      .addGroupBy('material.id')
      .addGroupBy('ladenLossen.id');

    const result = await qb.getRawAndEntities();
    if (!result.entities.length) {
      throw new NotFoundException(`Contract with id ${id} not found`);
    }

    return { data: this.attachCalculations(result.entities[0], result.raw[0]) };
  }

  async create(dto: CreateContractDto, userId: string) {
    const existing = await this.contractRepository.findOne({
      where: { number: dto.number },
    });
    if (existing) {
      throw new ConflictException(`Contract number ${dto.number} already exists`);
    }

    const contract = this.contractRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.contractRepository.save(contract);

    await this.auditLogService.log({
      entityType: 'contract',
      entityId: saved.id,
      action: 'create',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  async update(id: string, dto: UpdateContractDto, userId: string) {
    const existing = await this.contractRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Contract with id ${id} not found`);
    }

    if (dto.number && dto.number !== existing.number) {
      const duplicate = await this.contractRepository.findOne({
        where: { number: dto.number },
      });
      if (duplicate) {
        throw new ConflictException(`Contract number ${dto.number} already exists`);
      }
    }

    const oldValue = { ...existing } as unknown as Record<string, unknown>;
    Object.assign(existing, dto, { updatedBy: userId });
    const saved = await this.contractRepository.save(existing);

    await this.auditLogService.log({
      entityType: 'contract',
      entityId: saved.id,
      action: 'update',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return { data: saved };
  }

  private attachCalculations(
    contract: Contract,
    raw: Record<string, unknown>,
  ): ContractWithCalculations {
    const processedWeight = Number(raw['processed_weight']) || 0;
    const linkedWeight = Number(raw['linked_weight']) || 0;
    const remainingVolume = contract.agreedVolume - processedWeight;
    const utilizationPct =
      contract.agreedVolume > 0
        ? Math.round((processedWeight / contract.agreedVolume) * 10000) / 100
        : 0;
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Object.assign(contract, {
      processedWeight,
      linkedWeight,
      remainingVolume,
      utilizationPct,
      daysRemaining,
    });
  }
}
