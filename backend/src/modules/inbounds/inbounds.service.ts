import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from './entities/inbound.entity';
import { WeighbridgeTicket } from '../weighbridge-tickets/entities/weighbridge-ticket.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { CreateInboundWeighInDto } from './dto/create-inbound-weigh-in.dto';
import { UpdateInboundQualityDto } from './dto/update-inbound-quality.dto';
import { UpdateInboundWeighOutDto } from './dto/update-inbound-weigh-out.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { InventoryService } from '../inventory/inventory.service';
import { PdfService } from '../pdf/pdf.service';
import { InboundStatus } from '../../common/enums';

const INBOUND_RELATIONS = [
  'contract',
  'contract.material',
  'supplier',
  'vehicle',
  'transporter',
  'location',
  'material',
  'ticket',
];

@Injectable()
export class InboundsService {
  constructor(
    @InjectRepository(Inbound)
    private readonly inboundRepository: Repository<Inbound>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(WeighbridgeTicket)
    private readonly ticketRepository: Repository<WeighbridgeTicket>,
    private readonly auditLogService: AuditLogService,
    private readonly inventoryService: InventoryService,
    private readonly pdfService: PdfService,
  ) {}

  // ─── QUERIES ─────────────────────────────────────────────

  async findAll(filters?: {
    status?: InboundStatus;
    contractId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.inboundRepository
      .createQueryBuilder('inbound')
      .leftJoinAndSelect('inbound.contract', 'contract')
      .leftJoinAndSelect('contract.material', 'contractMaterial')
      .leftJoinAndSelect('inbound.supplier', 'supplier')
      .leftJoinAndSelect('inbound.vehicle', 'vehicle')
      .leftJoinAndSelect('inbound.transporter', 'transporter')
      .leftJoinAndSelect('inbound.location', 'location')
      .leftJoinAndSelect('inbound.material', 'material');

    if (filters?.status) {
      qb.andWhere('inbound.status = :status', { status: filters.status });
    }
    if (filters?.contractId) {
      qb.andWhere('inbound.contractId = :contractId', {
        contractId: filters.contractId,
      });
    }

    qb.orderBy('inbound.inboundDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const inbound = await this.inboundRepository.findOne({
      where: { id },
      relations: INBOUND_RELATIONS,
    });
    if (!inbound) {
      throw new NotFoundException(`Inbound with id ${id} not found`);
    }
    return { data: inbound };
  }

  // ─── PHASE 5a: WEIGH-IN ─────────────────────────────────

  async weighIn(dto: CreateInboundWeighInDto, userId: string) {
    let materialId: string;
    let pricePerTon: number | null = null;
    let transporterId: string | null = null;
    let contractId: string | null = null;

    if (dto.contractId) {
      const contract = await this.contractRepository.findOne({
        where: { id: dto.contractId },
        relations: ['material', 'transporter'],
      });
      if (!contract) {
        throw new NotFoundException(
          `Contract with id ${dto.contractId} not found`,
        );
      }
      contractId = contract.id;
      materialId = contract.materialId;
      pricePerTon = contract.price;
      transporterId = contract.transporterId ?? null;

      // Allow DTO overrides
      if (dto.pricePerTon !== undefined) pricePerTon = dto.pricePerTon;
      if (dto.transporterId !== undefined) transporterId = dto.transporterId;
    } else {
      // No contract mode — materialId is required
      if (!dto.materialId) {
        throw new BadRequestException(
          'materialId is required when no contract is provided',
        );
      }
      materialId = dto.materialId;
      pricePerTon = dto.pricePerTon ?? null;
      transporterId = dto.transporterId ?? null;
    }

    const weegbonNr = await this.generateWeegbonNr();

    const inbound = this.inboundRepository.create({
      weegbonNr,
      inboundDate: new Date(),
      vehicleId: null,
      licensePlate: dto.licensePlate ?? null,
      transporterId,
      supplierId: dto.supplierId,
      contractId,
      materialId,
      pricePerTon,
      grossWeight: dto.grossWeight,
      grossWeightAt: new Date(),
      status: InboundStatus.WEIGHED_IN,
      arrivalNotes: dto.arrivalNotes ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.inboundRepository.save(inbound);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'weigh_in',
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── PHASE 5b: QUALITY ──────────────────────────────────

  async updateQuality(
    id: string,
    dto: UpdateInboundQualityDto,
    userId: string,
  ) {
    const inbound = await this.inboundRepository.findOne({
      where: { id },
    });
    if (!inbound) {
      throw new NotFoundException(`Inbound with id ${id} not found`);
    }

    if (
      inbound.status !== InboundStatus.WEIGHED_IN &&
      inbound.status !== InboundStatus.IN_YARD
    ) {
      throw new BadRequestException(
        `Cannot update quality for inbound in status "${inbound.status}". Expected "weighed_in" or "in_yard".`,
      );
    }

    const oldValue = { ...inbound } as unknown as Record<string, unknown>;

    inbound.locationId = dto.locationId;
    inbound.hmsaPct = dto.hmsaPct;
    inbound.hmsbPct = dto.hmsbPct;
    inbound.impPct = dto.impPct;
    inbound.specialFindings = dto.specialFindings ?? null;
    inbound.qualityNotes = dto.qualityNotes ?? inbound.qualityNotes;
    inbound.qualityCheckedAt = new Date();
    inbound.status = InboundStatus.QUALITY_CHECKED;
    inbound.updatedBy = userId;

    // Calculate impurity weight if we already have net_weight
    if (inbound.netWeight != null) {
      this.calculateImpurityFields(inbound);
    }

    const saved = await this.inboundRepository.save(inbound);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'quality_check',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── PHASE 5c: WEIGH-OUT ────────────────────────────────

  async weighOut(id: string, dto: UpdateInboundWeighOutDto, userId: string) {
    const inbound = await this.inboundRepository.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!inbound) {
      throw new NotFoundException(`Inbound with id ${id} not found`);
    }

    const validStatuses = [
      InboundStatus.WEIGHED_IN,
      InboundStatus.IN_YARD,
      InboundStatus.QUALITY_CHECKED,
    ];
    if (!validStatuses.includes(inbound.status)) {
      throw new BadRequestException(
        `Cannot weigh-out inbound in status "${inbound.status}". Expected one of: ${validStatuses.join(', ')}.`,
      );
    }

    const oldValue = { ...inbound } as unknown as Record<string, unknown>;

    inbound.tareWeight = dto.tareWeight;
    inbound.tareWeightAt = new Date();
    inbound.weighedOutAt = new Date();
    inbound.netWeight = inbound.grossWeight! - dto.tareWeight;
    inbound.qualityNotes = dto.qualityNotes ?? inbound.qualityNotes;
    inbound.status = InboundStatus.WEIGHED_OUT;
    inbound.updatedBy = userId;

    // Recalculate impurity and financial fields
    this.calculateImpurityFields(inbound);
    this.calculateFinancials(inbound, inbound.contract!);

    const saved = await this.inboundRepository.save(inbound);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'weigh_out',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── PHASE 5d: COMPLETE ─────────────────────────────────

  async complete(id: string, userId: string) {
    const inbound = await this.inboundRepository.findOne({
      where: { id },
      relations: ['contract'],
    });
    if (!inbound) {
      throw new NotFoundException(`Inbound with id ${id} not found`);
    }

    if (inbound.status !== InboundStatus.WEIGHED_OUT) {
      throw new BadRequestException(
        `Cannot complete inbound in status "${inbound.status}". Expected "weighed_out".`,
      );
    }

    if (inbound.tareWeight == null) {
      throw new BadRequestException(
        'Cannot complete inbound without tare weight.',
      );
    }
    if (inbound.locationId == null) {
      throw new BadRequestException(
        'Cannot complete inbound without yard location.',
      );
    }

    const oldValue = { ...inbound } as unknown as Record<string, unknown>;

    // Ensure financials are up to date
    this.calculateImpurityFields(inbound);
    this.calculateFinancials(inbound, inbound.contract!);

    inbound.completedAt = new Date();
    inbound.status = InboundStatus.COMPLETED;
    inbound.updatedBy = userId;

    const saved = await this.inboundRepository.save(inbound);

    // Create inventory movement + update position
    await this.inventoryService.createInboundMovement({
      inboundId: saved.id,
      materialId: saved.materialId,
      locationId: saved.locationId!,
      quantityKg: saved.netWeightAfterImp ?? saved.netWeight!,
      costEur: Number(saved.totalInboundValue) || 0,
      userId,
    });

    // Generate weegbon PDF and create ticket
    const fullInbound = await this.inboundRepository.findOne({
      where: { id: saved.id },
      relations: INBOUND_RELATIONS,
    });
    const pdfUrl = await this.pdfService.generateWeegbonPdf(fullInbound!);

    const ticket = this.ticketRepository.create({
      inboundId: saved.id,
      ticketNumber: saved.weegbonNr,
      printedAt: new Date(),
      pdfUrl,
      createdBy: userId,
      updatedBy: userId,
    });
    await this.ticketRepository.save(ticket);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'complete',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── HELPERS ─────────────────────────────────────────────

  private calculateImpurityFields(inbound: Inbound): void {
    if (inbound.netWeight != null && inbound.impPct != null) {
      inbound.impWeight = Math.round(
        inbound.netWeight * (inbound.impPct / 100),
      );
      inbound.netWeightAfterImp = inbound.netWeight - inbound.impWeight;
    }
  }

  private calculateFinancials(inbound: Inbound, contract: Contract): void {
    const netAfterImp = inbound.netWeightAfterImp ?? inbound.netWeight ?? 0;
    const pricePerTon = Number(inbound.pricePerTon ?? contract.price) || 0;
    const impDeductionRate = Number(contract.impDeduction) || 0;

    // material_cost = (net_weight_after_imp / 1000) * price_per_ton
    const materialCost =
      Math.round((netAfterImp / 1000) * pricePerTon * 100) / 100;

    // impurity_deduction = ((net_weight - net_weight_after_imp) / 1000) * imp_deduction_rate
    const impurityWeight =
      (inbound.netWeight ?? 0) - (inbound.netWeightAfterImp ?? 0);
    const impurityDeduction =
      Math.round((impurityWeight / 1000) * impDeductionRate * 100) / 100;

    // total = material_cost - impurity_deduction (deduction reduces value)
    const totalValue =
      Math.round((materialCost - impurityDeduction) * 100) / 100;

    inbound.materialCost = materialCost;
    inbound.impurityDeduction = impurityDeduction;
    inbound.totalInboundValue = totalValue;
  }

  private async generateWeegbonNr(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `${yy}${mm}${dd}`;

    const latest = await this.inboundRepository
      .createQueryBuilder('inbound')
      .where('inbound.weegbon_nr LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('inbound.weegbon_nr', 'DESC')
      .getOne();

    let sequence = 1;
    if (latest) {
      const lastSeq = parseInt(latest.weegbonNr.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence}`;
  }
}
