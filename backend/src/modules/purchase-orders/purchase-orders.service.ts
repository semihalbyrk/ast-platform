import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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
    const inbounds = await this.inboundRepository.find({
      where: {
        supplierId: dto.supplierId,
        status: InboundStatus.COMPLETED,
        inboundDate: Between(
          new Date(dto.periodStart),
          new Date(dto.periodEnd + 'T23:59:59.999Z'),
        ),
      },
      relations: ['contract', 'material'],
      order: { inboundDate: 'ASC' },
    });

    const poNumber = await this.generatePoNumber();

    // Determine payment terms from first inbound's contract or supplier
    let paymentTerms = 7;
    if (inbounds.length > 0 && inbounds[0].contract?.paymentTerms) {
      paymentTerms = inbounds[0].contract.paymentTerms;
    }

    const issueDate = new Date();
    const paymentDueDate = new Date(issueDate);
    paymentDueDate.setDate(paymentDueDate.getDate() + paymentTerms);

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

      // Impurity line (only if there's impurity weight and a deduction rate)
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
    const vatPct = 0; // EU reverse charge
    const vatAmount = 0;
    const totalInclVat = totalExclVat + vatAmount;

    const po = this.poRepository.create({
      poNumber,
      supplierId: dto.supplierId,
      contractId: inbounds.length > 0 ? inbounds[0].contractId : null,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      issueDate,
      paymentDueDate,
      status: POStatus.DRAFT,
      totalExclVat,
      vat: vatAmount,
      totalInclVat,
      vatCode: String(vatPct),
      lineItems: lineItems as POLineItem[],
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.poRepository.save(po);

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
    supplierId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .loadRelationCountAndMap('po.lineItemCount', 'po.lineItems');

    if (filters?.status) {
      qb.andWhere('po.status = :status', { status: filters.status });
    }
    if (filters?.supplierId) {
      qb.andWhere('po.supplierId = :supplierId', {
        supplierId: filters.supplierId,
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
      relations: ['supplier', 'contract', 'lineItems', 'lineItems.inbound'],
    });
    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }
    // Sort line items: material first, then impurity, grouped by inbound
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
    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }
    if (po.status !== POStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot approve PO in status "${po.status}". Expected "draft".`,
      );
    }

    const oldStatus = po.status;
    po.status = POStatus.APPROVED;
    po.updatedBy = userId;

    // Generate invoice PDF
    const fullPo = await this.poRepository.findOne({
      where: { id },
      relations: ['supplier', 'contract', 'lineItems', 'lineItems.inbound'],
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
    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }
    if (po.status !== POStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot reject PO in status "${po.status}". Expected "draft".`,
      );
    }

    const oldStatus = po.status;
    po.status = POStatus.REJECTED;
    po.updatedBy = userId;
    const saved = await this.poRepository.save(po);

    await this.auditLogService.log({
      entityType: 'purchase_order',
      entityId: saved.id,
      action: 'reject',
      oldValue: { status: oldStatus },
      newValue: { status: saved.status, reason },
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
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }
}
