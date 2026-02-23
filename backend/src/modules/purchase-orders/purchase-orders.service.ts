import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { POLineItem } from './entities/po-line-item.entity';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { GeneratePurchaseOrderDto } from './dto/generate-purchase-order.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PdfService } from '../pdf/pdf.service';
import { POStatus, InboundStatus, LineType } from '../../common/enums';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(POLineItem)
    private readonly lineItemRepository: Repository<POLineItem>,
    @InjectRepository(Inbound)
    private readonly inboundRepository: Repository<Inbound>,
    private readonly auditLogService: AuditLogService,
    private readonly pdfService: PdfService,
  ) {}

  // ─── GENERATE PO ────────────────────────────────────────

  async generate(dto: GeneratePurchaseOrderDto, userId: string) {
    let inbounds: Inbound[];

    if (dto.inboundIds && dto.inboundIds.length > 0) {
      // Single or specific inbound PO
      inbounds = await this.inboundRepository.find({
        where: {
          id: In(dto.inboundIds),
          status: InboundStatus.COMPLETED,
        },
        relations: ['contract', 'material', 'supplier'],
        order: { inboundDate: 'ASC' },
      });

      inbounds = inbounds.filter((ib) => ib.contract?.entityId === dto.clientId);
    } else if (dto.periodStart && dto.periodEnd) {
      // Bulk PO by client + date range — query via contract.entityId
      const qb = this.inboundRepository
        .createQueryBuilder('inbound')
        .leftJoinAndSelect('inbound.contract', 'contract')
        .leftJoinAndSelect('inbound.material', 'material')
        .leftJoinAndSelect('inbound.supplier', 'supplier')
        .where('inbound.status = :status', { status: InboundStatus.COMPLETED })
        .andWhere('contract.entityId = :clientId', { clientId: dto.clientId })
        .andWhere('inbound.inboundDate >= :start', { start: new Date(dto.periodStart) })
        .andWhere('inbound.inboundDate <= :end', { end: new Date(dto.periodEnd + 'T23:59:59.999Z') })
        .orderBy('inbound.inboundDate', 'ASC');

      inbounds = await qb.getMany();
    } else {
      throw new BadRequestException(
        'Either inboundIds or periodStart+periodEnd must be provided',
      );
    }

    if (inbounds.length === 0) {
      throw new BadRequestException(
        'No completed inbounds found for the given criteria',
      );
    }

    const inboundIds = inbounds.map((ib) => ib.id);
    const linkedCount = await this.lineItemRepository
      .createQueryBuilder('li')
      .where('li.inbound_id IN (:...inboundIds)', { inboundIds })
      .getCount();
    if (linkedCount > 0) {
      throw new BadRequestException('One or more selected inbounds already have a purchase order.');
    }

    const poNumber = await this.generatePoNumber();

    let paymentTerms = 7;
    if (inbounds[0].contract?.paymentTerms) {
      paymentTerms = inbounds[0].contract.paymentTerms;
    }

    const issueDate = new Date();
    const paymentDueDate = new Date(issueDate);
    paymentDueDate.setDate(paymentDueDate.getDate() + paymentTerms);

    const dates = inbounds.map((i) => new Date(i.inboundDate));
    const periodStart = dto.periodStart
      ? new Date(dto.periodStart)
      : new Date(Math.min(...dates.map((d) => d.getTime())));
    const periodEnd = dto.periodEnd
      ? new Date(dto.periodEnd)
      : new Date(Math.max(...dates.map((d) => d.getTime())));

    // Build line items
    const lineItems: Partial<POLineItem>[] = [];
    let subtotal = 0;
    let impurityTotal = 0;

    for (const inbound of inbounds) {
      const netAfterImp = inbound.netWeightAfterImp ?? inbound.netWeight ?? 0;
      const pricePerTon = Number(inbound.pricePerTon ?? inbound.contract?.price) || 0;
      const materialCost = Math.round((netAfterImp / 1000) * pricePerTon * 100) / 100;

      lineItems.push({
        inboundId: inbound.id,
        lineType: LineType.MATERIAL,
        description: `${inbound.material?.name ?? 'Material'} (Weegbon #${inbound.weegbonNr})`,
        quantityKg: netAfterImp,
        unitPrice: pricePerTon,
        lineTotal: materialCost,
        createdBy: userId,
        updatedBy: userId,
      });
      subtotal += materialCost;

      const impWeight = (inbound.netWeight ?? 0) - (inbound.netWeightAfterImp ?? inbound.netWeight ?? 0);
      const impDeductionRate = Number(inbound.contract?.impDeduction) || 0;

      if (impWeight > 0 && impDeductionRate > 0) {
        const impCost = Math.round((impWeight / 1000) * impDeductionRate * 100) / 100;
        lineItems.push({
          inboundId: inbound.id,
          lineType: LineType.IMPURITY,
          description: `Impurity deduction (Weegbon #${inbound.weegbonNr})`,
          quantityKg: impWeight,
          unitPrice: -impDeductionRate,
          lineTotal: -impCost,
          createdBy: userId,
          updatedBy: userId,
        });
        impurityTotal -= impCost;
      }
    }

    const totalExclVat = Math.round((subtotal + impurityTotal) * 100) / 100;
    const totalInclVat = totalExclVat;

    const po = this.poRepository.create({
      poNumber,
      clientId: dto.clientId,
      contractId: inbounds[0].contractId,
      periodStart,
      periodEnd,
      issueDate,
      paymentDueDate,
      status: POStatus.READY,
      totalExclVat,
      vat: 0,
      totalInclVat,
      vatCode: '0',
      lineItems: lineItems as POLineItem[],
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.poRepository.save(po);

    // Generate PDF immediately
    const fullPo = await this.poRepository.findOne({
      where: { id: saved.id },
      relations: [
        'client',
        'contract',
        'lineItems',
        'lineItems.inbound',
        'lineItems.inbound.material',
        'lineItems.inbound.contract',
      ],
    });
    if (fullPo) {
      const pdfUrl = await this.pdfService.generateInvoicePdf(fullPo);
      saved.pdfUrl = pdfUrl;
      await this.poRepository.save(saved);
    }

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'generate',
      newValue: { poNumber: saved.poNumber, lineItemCount: lineItems.length, totalExclVat },
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── QUERIES ─────────────────────────────────────────────

  async findAll(filters?: {
    status?: POStatus;
    clientId?: string;
    inboundId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.client', 'client')
      .loadRelationCountAndMap('po.lineItemCount', 'po.lineItems');

    if (filters?.status) {
      qb.andWhere('po.status = :status', { status: filters.status });
    }
    if (filters?.clientId) {
      qb.andWhere('po.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.inboundId) {
      qb.innerJoin('po.lineItems', 'lineItemFilter', 'lineItemFilter.inbound_id = :inboundId', {
        inboundId: filters.inboundId,
      });
    }

    qb.orderBy('po.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: [
        'client',
        'contract',
        'lineItems',
        'lineItems.inbound',
        'lineItems.inbound.material',
        'lineItems.inbound.contract',
        'lineItems.inbound.supplier',
      ],
    });
    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }
    po.lineItems.sort((a, b) => {
      if (a.inboundId === b.inboundId) {
        return a.lineType === LineType.MATERIAL ? -1 : 1;
      }
      return (a.inboundId ?? '').localeCompare(b.inboundId ?? '');
    });
    return { data: po };
  }

  // ─── APPROVE / REJECT ───────────────────────────────────

  async approve(id: string, userId: string) {
    const po = await this.poRepository.findOne({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order with id ${id} not found`);
    if (po.status !== POStatus.READY) {
      throw new BadRequestException(`Cannot approve PO in status "${po.status}". Expected "ready".`);
    }

    const oldStatus = po.status;
    po.status = POStatus.READY;
    po.updatedBy = userId;

    const fullPo = await this.poRepository.findOne({
      where: { id },
      relations: [
        'client',
        'contract',
        'lineItems',
        'lineItems.inbound',
        'lineItems.inbound.material',
        'lineItems.inbound.contract',
      ],
    });
    const pdfUrl = await this.pdfService.generateInvoicePdf(fullPo!);
    po.pdfUrl = pdfUrl;

    const saved = await this.poRepository.save(po);

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'approve',
      oldValue: { status: oldStatus },
      newValue: { status: saved.status, pdfUrl },
      userId,
    });

    return this.findOne(saved.id);
  }

  async reject(id: string, reason: string | undefined, userId: string) {
    const po = await this.poRepository.findOne({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order with id ${id} not found`);
    if (po.status !== POStatus.READY) {
      throw new BadRequestException(`Cannot reject PO in status "${po.status}". Expected "ready".`);
    }

    po.status = POStatus.REJECTED;
    po.updatedBy = userId;
    const saved = await this.poRepository.save(po);

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'reject',
      oldValue: { status: po.status },
      newValue: { status: saved.status, reason },
      userId,
    });

    return this.findOne(saved.id);
  }

  async markPaid(id: string, userId: string) {
    const po = await this.poRepository.findOne({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order with id ${id} not found`);
    if (po.status !== POStatus.READY) {
      throw new BadRequestException(`Cannot mark PO as paid in status "${po.status}". Expected "ready".`);
    }

    const oldStatus = po.status;
    po.status = POStatus.PAID;
    po.updatedBy = userId;
    const saved = await this.poRepository.save(po);

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'mark_paid',
      oldValue: { status: oldStatus },
      newValue: { status: saved.status },
      userId,
    });

    return this.findOne(saved.id);
  }

  async setStatus(id: string, status: POStatus, userId: string) {
    const po = await this.poRepository.findOne({ where: { id } });
    if (!po) throw new NotFoundException(`Purchase order with id ${id} not found`);

    const allowedNext: POStatus[] = [POStatus.READY, POStatus.PAID, POStatus.REJECTED];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException('Unsupported PO status.');
    }

    if (po.status !== POStatus.READY && status !== po.status) {
      throw new BadRequestException(`Status change allowed only from "ready". Current: "${po.status}".`);
    }

    const oldStatus = po.status;
    po.status = status;
    po.updatedBy = userId;
    const saved = await this.poRepository.save(po);

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'set_status',
      oldValue: { status: oldStatus },
      newValue: { status: saved.status },
      userId,
    });

    return this.findOne(saved.id);
  }

  // ─── HELPERS ─────────────────────────────────────────────

  private async generatePoNumber(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `PO-${yyyy}${mm}${dd}`;

    const latest = await this.poRepository
      .createQueryBuilder('po')
      .where('po.po_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('po.po_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (latest) {
      const lastSeq = parseInt(latest.poNumber.split('-').pop() ?? '0', 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }
}
