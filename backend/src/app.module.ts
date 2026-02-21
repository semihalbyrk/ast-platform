import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { YardLocationsModule } from './modules/yard-locations/yard-locations.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { InboundsModule } from './modules/inbounds/inbounds.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WeighbridgeModule } from './modules/weighbridge/weighbridge.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    AuthModule,
    UsersModule,
    AuditLogModule,
    EntitiesModule,
    MaterialsModule,
    YardLocationsModule,
    VehiclesModule,
    ContractsModule,
    InboundsModule,
    InventoryModule,
    WeighbridgeModule,
    PurchaseOrdersModule,
    PdfModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}
