import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PdfService } from '../pdf/pdf.service';
import { GeneratePurchaseOrderDto } from './dto/generate-purchase-order.dto';
import { RejectPurchaseOrderDto } from './dto/reject-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, POStatus } from '../../common/enums';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: POStatus,
    @Query('supplierId') supplierId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.purchaseOrdersService.findAll({
      status,
      supplierId,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { data: po } = await this.purchaseOrdersService.findOne(id);
    if (!po.pdfUrl) {
      throw new NotFoundException('PDF not yet generated for this purchase order');
    }
    const buffer = await this.pdfService.getInvoicePdf(po.poNumber);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${po.poNumber}.pdf"`,
    });
    res.send(buffer);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  async generate(
    @Body() dto: GeneratePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.generate(dto, userId);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.approve(id, userId);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.reject(id, dto.reason, userId);
  }
}
