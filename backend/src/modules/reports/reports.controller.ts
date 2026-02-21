import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ContractStatus } from '../../common/enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.FINANCE,
  UserRole.OPERATIONS_MANAGER,
  UserRole.MANAGEMENT,
  UserRole.ADMIN,
)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory')
  async inventoryReport(
    @Query('format') format: string = 'csv',
    @Res() res: Response,
  ) {
    const fmt = format === 'json' ? 'json' : 'csv';
    const result = await this.reportsService.getInventoryReport(fmt);

    if (fmt === 'csv') {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="inventory-report.csv"',
      });
      return res.send(result);
    }
    return res.json(result);
  }

  @Get('suppliers')
  async suppliersReport(
    @Query('format') format: string = 'csv',
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Res() res?: Response,
  ) {
    const fmt = format === 'json' ? 'json' : 'csv';
    const result = await this.reportsService.getSuppliersReport(
      periodStart,
      periodEnd,
      fmt,
    );

    if (fmt === 'csv') {
      res!.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="suppliers-report.csv"',
      });
      return res!.send(result);
    }
    return res!.json(result);
  }

  @Get('contracts')
  async contractsReport(
    @Query('format') format: string = 'csv',
    @Query('status') status?: ContractStatus,
    @Res() res?: Response,
  ) {
    const fmt = format === 'json' ? 'json' : 'csv';
    const result = await this.reportsService.getContractsReport(status, fmt);

    if (fmt === 'csv') {
      res!.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="contracts-report.csv"',
      });
      return res!.send(result);
    }
    return res!.json(result);
  }
}
