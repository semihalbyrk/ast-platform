import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { InventoryPosition } from '../inventory/entities/inventory-position.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inbound,
      InventoryPosition,
      PurchaseOrder,
      Contract,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
