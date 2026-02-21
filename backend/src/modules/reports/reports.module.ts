import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryPosition } from '../inventory/entities/inventory-position.entity';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryPosition, Inbound, Contract])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
