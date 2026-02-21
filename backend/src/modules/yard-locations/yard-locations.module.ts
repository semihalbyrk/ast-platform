import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YardLocation } from './entities/yard-location.entity';
import { YardLocationsService } from './yard-locations.service';
import { YardLocationsController } from './yard-locations.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([YardLocation]), AuditLogModule],
  controllers: [YardLocationsController],
  providers: [YardLocationsService],
  exports: [YardLocationsService],
})
export class YardLocationsModule {}
