import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { InboundStatus } from '../../common/enums';

@Injectable()
export class WeighbridgeService {
  constructor(
    @InjectRepository(Inbound)
    private readonly inboundRepository: Repository<Inbound>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async recordWeight(
    weegbonNr: string,
    weightKg: number,
    weighingNumber: 1 | 2,
    timestamp: string,
  ) {
    const inbound = await this.inboundRepository.findOne({
      where: { weegbonNr },
      relations: ['contract', 'supplier', 'vehicle', 'transporter', 'location', 'material'],
    });
    if (!inbound) {
      throw new NotFoundException(
        `Inbound with weegbon_nr "${weegbonNr}" not found`,
      );
    }

    if (inbound.status === InboundStatus.COMPLETED) {
      throw new BadRequestException(
        `Inbound "${weegbonNr}" is already completed. Cannot record weight.`,
      );
    }

    const oldValue = { ...inbound } as unknown as Record<string, unknown>;

    if (weighingNumber === 1) {
      return this.recordGrossWeight(inbound, weightKg, timestamp, oldValue);
    } else {
      return this.recordTareWeight(inbound, weightKg, timestamp, oldValue);
    }
  }

  private async recordGrossWeight(
    inbound: Inbound,
    weightKg: number,
    timestamp: string,
    oldValue: Record<string, unknown>,
  ) {
    inbound.grossWeight = weightKg;
    inbound.grossWeightAt = new Date(timestamp);

    const saved = await this.inboundRepository.save(inbound);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'weigh_in_webhook',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
    });

    return { data: saved };
  }

  private async recordTareWeight(
    inbound: Inbound,
    weightKg: number,
    timestamp: string,
    oldValue: Record<string, unknown>,
  ) {
    if (inbound.grossWeight == null) {
      throw new BadRequestException(
        `Inbound "${inbound.weegbonNr}" has no gross weight. Record weighing_number=1 first.`,
      );
    }

    const validStatuses = [
      InboundStatus.WEIGHED_IN,
      InboundStatus.IN_YARD,
      InboundStatus.QUALITY_CHECKED,
    ];
    if (!validStatuses.includes(inbound.status)) {
      throw new BadRequestException(
        `Cannot record tare weight for inbound in status "${inbound.status}".`,
      );
    }

    inbound.tareWeight = weightKg;
    inbound.tareWeightAt = new Date(timestamp);
    inbound.netWeight = inbound.grossWeight - weightKg;
    inbound.status = InboundStatus.WEIGHED_OUT;

    // Recalculate impurity fields if quality data exists
    if (inbound.netWeight != null && inbound.impPct != null) {
      inbound.impWeight = Math.round(
        inbound.netWeight * (Number(inbound.impPct) / 100),
      );
      inbound.netWeightAfterImp = inbound.netWeight - inbound.impWeight;
    }

    // Calculate financials
    if (inbound.contract) {
      const netAfterImp =
        inbound.netWeightAfterImp ?? inbound.netWeight ?? 0;
      const pricePerTon =
        Number(inbound.pricePerTon ?? inbound.contract.price) || 0;
      const impDeductionRate = Number(inbound.contract.impDeduction) || 0;

      inbound.materialCost =
        Math.round((netAfterImp / 1000) * pricePerTon * 100) / 100;

      const impurityWeight =
        (inbound.netWeight ?? 0) - (inbound.netWeightAfterImp ?? 0);
      inbound.impurityDeduction =
        Math.round((impurityWeight / 1000) * impDeductionRate * 100) / 100;

      inbound.totalInboundValue =
        Math.round(
          (inbound.materialCost - inbound.impurityDeduction) * 100,
        ) / 100;
    }

    const saved = await this.inboundRepository.save(inbound);

    await this.auditLogService.log({
      entityType: 'inbound',
      entityId: saved.id,
      action: 'weigh_out_webhook',
      oldValue,
      newValue: saved as unknown as Record<string, unknown>,
    });

    return { data: saved };
  }
}
