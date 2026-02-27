import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryPosition } from './entities/inventory-position.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { YardLocation } from '../yard-locations/entities/yard-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryPosition, InventoryMovement, Inbound, YardLocation])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
