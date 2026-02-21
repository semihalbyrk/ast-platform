import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { InventoryPosition } from '../inventory/entities/inventory-position.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { Contract } from '../contracts/entities/contract.entity';
import {
  InboundStatus,
  POStatus,
  ContractStatus,
} from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Inbound)
    private readonly inboundRepository: Repository<Inbound>,
    @InjectRepository(InventoryPosition)
    private readonly inventoryRepository: Repository<InventoryPosition>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

  async getSummary() {
    const [
      inboundsToday,
      inboundsThisWeek,
      inboundsThisMonth,
      inventory,
      purchaseOrders,
      topSuppliers,
      contractsAtRisk,
      recentInbounds,
    ] = await Promise.all([
      this.getInboundsPeriod('today'),
      this.getInboundsPeriod('week'),
      this.getInboundsPeriod('month'),
      this.getInventorySummary(),
      this.getPurchaseOrderSummary(),
      this.getTopSuppliers(),
      this.getContractsAtRisk(),
      this.getRecentInbounds(),
    ]);

    return {
      data: {
        inbounds_today: inboundsToday,
        inbounds_this_week: inboundsThisWeek,
        inbounds_this_month: inboundsThisMonth,
        inventory,
        purchase_orders: purchaseOrders,
        top_suppliers: topSuppliers,
        contracts_at_risk: contractsAtRisk,
        recent_inbounds: recentInbounds,
      },
    };
  }

  private async getInboundsPeriod(
    period: 'today' | 'week' | 'month',
  ): Promise<{ count: number; total_weight_kg: number; total_value_eur: number }> {
    let dateFilter: string;
    if (period === 'today') {
      dateFilter = "DATE(i.created_at) = CURRENT_DATE";
    } else if (period === 'week') {
      dateFilter = "i.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
    } else {
      dateFilter = "i.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    }

    const result = await this.inboundRepository
      .createQueryBuilder('i')
      .select('COUNT(i.id)', 'count')
      .addSelect('COALESCE(SUM(i.net_weight_after_imp), 0)', 'total_weight_kg')
      .addSelect('COALESCE(SUM(i.total_inbound_value), 0)', 'total_value_eur')
      .where(`i.status = :status`, { status: InboundStatus.COMPLETED })
      .andWhere(dateFilter)
      .getRawOne();

    return {
      count: parseInt(result.count, 10),
      total_weight_kg: parseInt(result.total_weight_kg, 10),
      total_value_eur: parseFloat(result.total_value_eur),
    };
  }

  private async getInventorySummary() {
    // Totals
    const totals = await this.inventoryRepository
      .createQueryBuilder('ip')
      .select('COALESCE(SUM(ip.quantity_kg), 0)', 'total_quantity_kg')
      .addSelect('COALESCE(SUM(ip.total_cost_eur), 0)', 'total_value_eur')
      .addSelect('COUNT(ip.id)', 'position_count')
      .getRawOne();

    // By material
    const byMaterial = await this.inventoryRepository
      .createQueryBuilder('ip')
      .leftJoin('ip.material', 'm')
      .select('m.code', 'code')
      .addSelect('COALESCE(SUM(ip.quantity_kg), 0)', 'quantity_kg')
      .addSelect('COALESCE(SUM(ip.total_cost_eur), 0)', 'value_eur')
      .groupBy('m.code')
      .orderBy('quantity_kg', 'DESC')
      .getRawMany();

    // By location
    const byLocation = await this.inventoryRepository
      .createQueryBuilder('ip')
      .leftJoin('ip.location', 'l')
      .select('l.name', 'code')
      .addSelect('COALESCE(SUM(ip.quantity_kg), 0)', 'quantity_kg')
      .addSelect('COALESCE(SUM(ip.total_cost_eur), 0)', 'value_eur')
      .groupBy('l.name')
      .orderBy('quantity_kg', 'DESC')
      .getRawMany();

    return {
      total_quantity_kg: parseInt(totals.total_quantity_kg, 10),
      total_value_eur: parseFloat(totals.total_value_eur),
      position_count: parseInt(totals.position_count, 10),
      by_material: byMaterial.map((r) => ({
        code: r.code,
        quantity_kg: parseInt(r.quantity_kg, 10),
        value_eur: parseFloat(r.value_eur),
      })),
      by_location: byLocation.map((r) => ({
        code: r.code,
        quantity_kg: parseInt(r.quantity_kg, 10),
        value_eur: parseFloat(r.value_eur),
      })),
    };
  }

  private async getPurchaseOrderSummary() {
    const results = await this.poRepository
      .createQueryBuilder('po')
      .select('po.status', 'status')
      .addSelect('COUNT(po.id)', 'count')
      .addSelect('COALESCE(SUM(po.total_excl_vat), 0)', 'value')
      .groupBy('po.status')
      .getRawMany();

    const byStatus: Record<string, { count: number; value: number }> = {};
    for (const r of results) {
      byStatus[r.status] = {
        count: parseInt(r.count, 10),
        value: parseFloat(r.value),
      };
    }

    return {
      draft_count: byStatus[POStatus.DRAFT]?.count ?? 0,
      draft_value_eur: byStatus[POStatus.DRAFT]?.value ?? 0,
      approved_count: byStatus[POStatus.APPROVED]?.count ?? 0,
      approved_value_eur: byStatus[POStatus.APPROVED]?.value ?? 0,
      rejected_count: byStatus[POStatus.REJECTED]?.count ?? 0,
    };
  }

  private async getTopSuppliers() {
    const results = await this.inboundRepository
      .createQueryBuilder('i')
      .leftJoin('i.supplier', 'e')
      .select('e.id', 'id')
      .addSelect('e.name', 'name')
      .addSelect('COUNT(i.id)', 'deliveries_this_month')
      .addSelect('COALESCE(SUM(i.net_weight_after_imp), 0)', 'total_weight_kg')
      .addSelect('COALESCE(SUM(i.total_inbound_value), 0)', 'total_value_eur')
      .where("i.created_at >= DATE_TRUNC('month', CURRENT_DATE)")
      .andWhere('i.status = :status', { status: InboundStatus.COMPLETED })
      .groupBy('e.id')
      .addGroupBy('e.name')
      .orderBy('total_weight_kg', 'DESC')
      .limit(5)
      .getRawMany();

    // Get contract utilization for each supplier
    const supplierIds = results.map((r) => r.id).filter(Boolean);
    let utilizationMap: Record<string, number> = {};

    if (supplierIds.length > 0) {
      const contracts = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoin('c.inbounds', 'i', "i.status = 'completed'")
        .select('c.entity_id', 'entity_id')
        .addSelect('SUM(c.agreed_volume)', 'agreed')
        .addSelect('COALESCE(SUM(i.net_weight_after_imp), 0)', 'processed')
        .where('c.entity_id IN (:...ids)', { ids: supplierIds })
        .andWhere('c.status = :status', { status: ContractStatus.LOPEND })
        .groupBy('c.entity_id')
        .getRawMany();

      for (const c of contracts) {
        const agreed = parseFloat(c.agreed) || 1;
        const processed = parseFloat(c.processed) || 0;
        utilizationMap[c.entity_id] =
          Math.round((processed / agreed) * 1000) / 10;
      }
    }

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      deliveries_this_month: parseInt(r.deliveries_this_month, 10),
      total_weight_kg: parseInt(r.total_weight_kg, 10),
      total_value_eur: parseFloat(r.total_value_eur),
      contract_utilization_pct: utilizationMap[r.id] ?? 0,
    }));
  }

  private async getContractsAtRisk() {
    const results = await this.contractRepository
      .createQueryBuilder('c')
      .leftJoin('c.entity', 'e')
      .leftJoin('c.material', 'm')
      .leftJoin('c.inbounds', 'i', "i.status = 'completed'")
      .select('c.id', 'id')
      .addSelect('c.number', 'number')
      .addSelect('e.name', 'supplier')
      .addSelect('m.name', 'material')
      .addSelect("(c.end_date - CURRENT_DATE)", 'days_remaining')
      .addSelect('COALESCE(SUM(i.net_weight_after_imp), 0)', 'processed')
      .addSelect('c.agreed_volume', 'agreed_volume')
      .addSelect('c.status', 'status')
      .where('c.status = :status', { status: ContractStatus.LOPEND })
      .andWhere("c.end_date <= CURRENT_DATE + INTERVAL '30 days'")
      .groupBy('c.id')
      .addGroupBy('e.name')
      .addGroupBy('m.name')
      .orderBy('days_remaining', 'ASC')
      .getRawMany();

    return results.map((r) => {
      const agreed = parseFloat(r.agreed_volume) || 1;
      const processed = parseFloat(r.processed) || 0;
      return {
        id: r.id,
        number: r.number,
        supplier: r.supplier,
        material: r.material,
        days_remaining: parseInt(r.days_remaining, 10),
        utilization_pct: Math.round((processed / agreed) * 1000) / 10,
        remaining_volume_kg: Math.round(agreed - processed),
        status: r.status,
      };
    });
  }

  private async getRecentInbounds() {
    const inbounds = await this.inboundRepository.find({
      where: { status: InboundStatus.COMPLETED },
      relations: ['supplier', 'material'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return inbounds.map((i) => ({
      id: i.id,
      weegbon_nr: i.weegbonNr,
      supplier: i.supplier?.name ?? '-',
      material: i.material?.name ?? '-',
      net_weight_kg: i.netWeightAfterImp ?? i.netWeight,
      total_value_eur: Number(i.totalInboundValue) || 0,
      status: i.status,
      created_at: i.createdAt,
    }));
  }
}
