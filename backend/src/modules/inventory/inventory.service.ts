import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryPosition } from './entities/inventory-position.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { MovementType } from '../../common/enums';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryPosition)
    private readonly positionRepository: Repository<InventoryPosition>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
  ) {}

  async createInboundMovement(params: {
    inboundId: string;
    materialId: string;
    locationId: string;
    quantityKg: number;
    costEur: number;
    userId: string;
  }): Promise<{ movement: InventoryMovement; position: InventoryPosition }> {
    const movement = this.movementRepository.create({
      inboundId: params.inboundId,
      materialId: params.materialId,
      locationId: params.locationId,
      type: MovementType.INBOUND,
      quantityKg: params.quantityKg,
      costEur: params.costEur,
      reason: 'Inbound completed',
      createdBy: params.userId,
      updatedBy: params.userId,
    });
    const savedMovement = await this.movementRepository.save(movement);

    const position = await this.updatePosition(
      params.materialId,
      params.locationId,
      params.quantityKg,
      params.costEur,
      params.userId,
    );

    return { movement: savedMovement, position };
  }

  // ─── QUERY METHODS ────────────────────────────────────

  async getPositions(filters?: {
    materialId?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.positionRepository
      .createQueryBuilder('pos')
      .leftJoinAndSelect('pos.material', 'material')
      .leftJoinAndSelect('pos.location', 'location')
      .where('pos.quantityKg > 0');

    if (filters?.materialId) {
      qb.andWhere('pos.materialId = :materialId', {
        materialId: filters.materialId,
      });
    }
    if (filters?.locationId) {
      qb.andWhere('pos.locationId = :locationId', {
        locationId: filters.locationId,
      });
    }

    qb.orderBy('pos.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async getMovements(filters?: {
    type?: MovementType;
    materialId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.movementRepository
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.material', 'material')
      .leftJoinAndSelect('mov.location', 'location');

    if (filters?.type) {
      qb.andWhere('mov.type = :type', { type: filters.type });
    }
    if (filters?.materialId) {
      qb.andWhere('mov.materialId = :materialId', {
        materialId: filters.materialId,
      });
    }

    qb.orderBy('mov.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page, limit } };
  }

  async getSummary() {
    const positions = await this.positionRepository.find({
      where: {},
      relations: ['material', 'location'],
    });

    const active = positions.filter((p) => p.quantityKg > 0);

    const totalQuantityKg = active.reduce((s, p) => s + p.quantityKg, 0);
    const totalValueEur = active.reduce(
      (s, p) => s + Number(p.totalCostEur),
      0,
    );

    const materialMap = new Map<
      string,
      { code: string | null; quantityKg: number; valueEur: number }
    >();
    const locationMap = new Map<
      string,
      { code: string | null; quantityKg: number; valueEur: number }
    >();

    for (const p of active) {
      const mKey = p.materialId;
      const mEntry = materialMap.get(mKey) ?? {
        code: p.material.code,
        quantityKg: 0,
        valueEur: 0,
      };
      mEntry.quantityKg += p.quantityKg;
      mEntry.valueEur += Number(p.totalCostEur);
      materialMap.set(mKey, mEntry);

      const lKey = p.locationId;
      const lEntry = locationMap.get(lKey) ?? {
        code: p.location.code,
        quantityKg: 0,
        valueEur: 0,
      };
      lEntry.quantityKg += p.quantityKg;
      lEntry.valueEur += Number(p.totalCostEur);
      locationMap.set(lKey, lEntry);
    }

    return {
      data: {
        totalQuantityKg,
        totalValueEur: Math.round(totalValueEur * 100) / 100,
        totalPositions: active.length,
        materials: Array.from(materialMap.values()),
        locations: Array.from(locationMap.values()),
      },
    };
  }

  // ─── MUTATION METHODS ────────────────────────────────

  private async updatePosition(
    materialId: string,
    locationId: string,
    addQuantityKg: number,
    addCostEur: number,
    userId: string,
  ): Promise<InventoryPosition> {
    let position = await this.positionRepository.findOne({
      where: { materialId, locationId },
    });

    if (position) {
      const newQuantityKg = position.quantityKg + addQuantityKg;
      const newTotalCostEur = Number(position.totalCostEur) + addCostEur;
      const newAvgCostEurTon =
        newQuantityKg > 0
          ? Math.round((newTotalCostEur / (newQuantityKg / 1000)) * 100) / 100
          : 0;

      position.quantityKg = newQuantityKg;
      position.totalCostEur = newTotalCostEur;
      position.avgCostEurTon = newAvgCostEurTon;
      position.updatedBy = userId;
    } else {
      const avgCostEurTon =
        addQuantityKg > 0
          ? Math.round((addCostEur / (addQuantityKg / 1000)) * 100) / 100
          : 0;

      position = this.positionRepository.create({
        materialId,
        locationId,
        quantityKg: addQuantityKg,
        totalCostEur: addCostEur,
        avgCostEurTon,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    return this.positionRepository.save(position);
  }
}
