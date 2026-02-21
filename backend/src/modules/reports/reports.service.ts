import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryPosition } from '../inventory/entities/inventory-position.entity';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { InboundStatus, ContractStatus } from '../../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(InventoryPosition)
    private readonly inventoryRepo: Repository<InventoryPosition>,
    @InjectRepository(Inbound)
    private readonly inboundRepo: Repository<Inbound>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  // ─── INVENTORY REPORT ──────────────────────────────────

  async getInventoryReport(format: 'csv' | 'json') {
    const positions = await this.inventoryRepo.find({
      relations: ['material', 'location'],
      order: { materialId: 'ASC', locationId: 'ASC' },
    });

    const data = positions.map((p) => ({
      material_code: p.material?.code ?? '-',
      material_name: p.material?.name ?? '-',
      location_code: p.location?.code ?? '-',
      location_name: p.location?.name ?? '-',
      quantity_kg: p.quantityKg,
      avg_cost_eur_ton: Number(p.avgCostEurTon),
      total_cost_eur: Number(p.totalCostEur),
    }));

    const summary = {
      total_quantity_kg: data.reduce((s, d) => s + d.quantity_kg, 0),
      total_value_eur: Math.round(data.reduce((s, d) => s + d.total_cost_eur, 0) * 100) / 100,
    };

    if (format === 'csv') {
      return this.toCsv(
        ['material_code', 'material_name', 'location_code', 'location_name', 'quantity_kg', 'avg_cost_eur_ton', 'total_cost_eur'],
        data,
      );
    }
    return { data, summary };
  }

  // ─── SUPPLIERS REPORT ──────────────────────────────────

  async getSuppliersReport(
    periodStart: string | undefined,
    periodEnd: string | undefined,
    format: 'csv' | 'json',
  ) {
    const now = new Date();
    const start = periodStart ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = periodEnd ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

    const results = await this.inboundRepo
      .createQueryBuilder('i')
      .leftJoin('i.supplier', 'e')
      .leftJoin('i.contract', 'c')
      .leftJoin('i.material', 'm')
      .select('e.name', 'supplier_name')
      .addSelect('e.vat_nr', 'supplier_vat')
      .addSelect('c.number', 'contract_number')
      .addSelect('m.name', 'material')
      .addSelect('COUNT(i.id)', 'deliveries')
      .addSelect('COALESCE(SUM(i.net_weight_after_imp), 0)', 'total_weight_kg')
      .addSelect('COALESCE(SUM(i.total_inbound_value), 0)', 'total_value_eur')
      .addSelect('c.agreed_volume', 'agreed_volume')
      .addSelect('c.status', 'status')
      .where('i.status = :status', { status: InboundStatus.COMPLETED })
      .andWhere('i.inbound_date >= :start', { start })
      .andWhere('i.inbound_date <= :end', { end: end + 'T23:59:59.999Z' })
      .groupBy('e.name')
      .addGroupBy('e.vat_nr')
      .addGroupBy('c.number')
      .addGroupBy('m.name')
      .addGroupBy('c.agreed_volume')
      .addGroupBy('c.status')
      .orderBy('total_weight_kg', 'DESC')
      .getRawMany();

    const data = results.map((r) => {
      const agreed = parseFloat(r.agreed_volume) || 0;
      const weight = parseInt(r.total_weight_kg, 10);
      return {
        supplier_name: r.supplier_name,
        supplier_vat: r.supplier_vat ?? '',
        contract_number: r.contract_number ?? '',
        material: r.material ?? '',
        deliveries: parseInt(r.deliveries, 10),
        total_weight_kg: weight,
        total_value_eur: parseFloat(r.total_value_eur),
        utilization_pct: agreed > 0 ? Math.round((weight / agreed) * 1000) / 10 : 0,
        status: r.status ?? '',
      };
    });

    const summary = {
      total_deliveries: data.reduce((s, d) => s + d.deliveries, 0),
      total_weight_kg: data.reduce((s, d) => s + d.total_weight_kg, 0),
      total_value_eur: Math.round(data.reduce((s, d) => s + d.total_value_eur, 0) * 100) / 100,
    };

    if (format === 'csv') {
      return this.toCsv(
        ['supplier_name', 'supplier_vat', 'contract_number', 'material', 'deliveries', 'total_weight_kg', 'total_value_eur', 'utilization_pct', 'status'],
        data,
      );
    }
    return { data, summary };
  }

  // ─── CONTRACTS REPORT ──────────────────────────────────

  async getContractsReport(
    status: ContractStatus | undefined,
    format: 'csv' | 'json',
  ) {
    const qb = this.contractRepo
      .createQueryBuilder('c')
      .leftJoin('c.entity', 'e')
      .leftJoin('c.material', 'm')
      .leftJoin('c.inbounds', 'i', "i.status = 'completed'")
      .leftJoin(
        'c.inbounds',
        'i_linked',
        "i_linked.status IN ('weighed_in', 'in_yard', 'quality_checked', 'weighed_out')",
      )
      .select('c.number', 'contract_number')
      .addSelect('e.name', 'supplier_name')
      .addSelect('m.name', 'material')
      .addSelect('c.agreed_volume', 'agreed_volume_kg')
      .addSelect('COALESCE(SUM(DISTINCT i.net_weight_after_imp), 0)', 'processed_weight_kg')
      .addSelect('COALESCE(SUM(DISTINCT i_linked.net_weight), 0)', 'linked_weight_kg')
      .addSelect('c.start_date', 'start_date')
      .addSelect('c.end_date', 'end_date')
      .addSelect('(c.end_date - CURRENT_DATE)', 'days_remaining')
      .addSelect('c.status', 'status')
      .groupBy('c.id')
      .addGroupBy('e.name')
      .addGroupBy('m.name')
      .orderBy('c.number', 'ASC');

    if (status) {
      qb.where('c.status = :status', { status });
    }

    const results = await qb.getRawMany();

    const data = results.map((r) => {
      const agreed = parseFloat(r.agreed_volume_kg) || 0;
      const processed = parseInt(r.processed_weight_kg, 10);
      return {
        contract_number: r.contract_number,
        supplier_name: r.supplier_name,
        material: r.material,
        agreed_volume_kg: Math.round(agreed),
        processed_weight_kg: processed,
        linked_weight_kg: parseInt(r.linked_weight_kg, 10),
        remaining_volume_kg: Math.round(agreed - processed),
        utilization_pct: agreed > 0 ? Math.round((processed / agreed) * 1000) / 10 : 0,
        start_date: this.formatDate(r.start_date),
        end_date: this.formatDate(r.end_date),
        days_remaining: parseInt(r.days_remaining, 10),
        status: r.status,
      };
    });

    const activeCount = data.filter((d) => d.status === ContractStatus.LOPEND).length;
    const expiredCount = data.filter((d) => d.days_remaining < 0).length;
    const totalAgreed = data.reduce((s, d) => s + d.agreed_volume_kg, 0);
    const totalProcessed = data.reduce((s, d) => s + d.processed_weight_kg, 0);

    const summary = {
      total_contracts: data.length,
      active_contracts: activeCount,
      expired_contracts: expiredCount,
      total_agreed_kg: totalAgreed,
      total_processed_kg: totalProcessed,
      avg_utilization_pct: totalAgreed > 0 ? Math.round((totalProcessed / totalAgreed) * 1000) / 10 : 0,
    };

    if (format === 'csv') {
      return this.toCsv(
        ['contract_number', 'supplier_name', 'material', 'agreed_volume_kg', 'processed_weight_kg', 'linked_weight_kg', 'remaining_volume_kg', 'utilization_pct', 'start_date', 'end_date', 'days_remaining', 'status'],
        data,
      );
    }
    return { data, summary };
  }

  // ─── CSV HELPER ────────────────────────────────────────

  private formatDate(d: unknown): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(String(d));
    return date.toISOString().split('T')[0];
  }

  private toCsv(headers: string[], rows: Record<string, unknown>[]): string {
    const escape = (val: unknown): string => {
      const s = val == null ? '' : String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ];
    return lines.join('\n');
  }
}
