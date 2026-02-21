import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, MovementType } from '../../common/enums';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getPositions(
    @Query('materialId') materialId?: string,
    @Query('locationId') locationId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.inventoryService.getPositions({
      materialId,
      locationId,
      page,
      limit,
    });
  }

  @Get('movements')
  async getMovements(
    @Query('type') type?: MovementType,
    @Query('materialId') materialId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.inventoryService.getMovements({
      type,
      materialId,
      page,
      limit,
    });
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE,
    UserRole.MANAGEMENT,
    UserRole.ADMIN,
  )
  async getSummary() {
    return this.inventoryService.getSummary();
  }
}
