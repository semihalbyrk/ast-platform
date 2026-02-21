import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { WeighbridgeService } from './weighbridge.service';
import { WeighbridgeController } from './weighbridge.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inbound]), AuditLogModule],
  controllers: [WeighbridgeController],
  providers: [WeighbridgeService],
})
export class WeighbridgeModule {}
