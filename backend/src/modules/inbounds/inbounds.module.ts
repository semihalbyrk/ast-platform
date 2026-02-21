import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from './entities/inbound.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { WeighbridgeTicket } from '../weighbridge-tickets/entities/weighbridge-ticket.entity';
import { InboundsService } from './inbounds.service';
import { InboundsController } from './inbounds.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inbound, Contract, Vehicle, WeighbridgeTicket]),
    AuditLogModule,
    InventoryModule,
    PdfModule,
  ],
  controllers: [InboundsController],
  providers: [InboundsService],
  exports: [InboundsService],
})
export class InboundsModule {}
