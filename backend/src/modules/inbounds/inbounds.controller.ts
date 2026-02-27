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
import { InboundsService } from './inbounds.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateInboundWeighInDto } from './dto/create-inbound-weigh-in.dto';
import { UpdateInboundQualityDto } from './dto/update-inbound-quality.dto';
import { UpdateInboundWeighOutDto } from './dto/update-inbound-weigh-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, InboundStatus } from '../../common/enums';

@Controller('inbounds')
@UseGuards(JwtAuthGuard)
export class InboundsController {
  constructor(
    private readonly inboundsService: InboundsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: InboundStatus,
    @Query('contractId') contractId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.inboundsService.findAll({ status, contractId, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundsService.findOne(id);
  }

  @Post('weigh-in')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCALE_OPERATOR, UserRole.ADMIN)
  async weighIn(
    @Body() dto: CreateInboundWeighInDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inboundsService.weighIn(dto, userId);
  }

  @Patch(':id/quality')
  @UseGuards(RolesGuard)
  @Roles(UserRole.QUALITY_INSPECTOR, UserRole.ADMIN)
  async updateQuality(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInboundQualityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inboundsService.updateQuality(id, dto, userId);
  }

  @Patch(':id/weigh-out')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCALE_OPERATOR, UserRole.ADMIN)
  async weighOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInboundWeighOutDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inboundsService.weighOut(id, dto, userId);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { data: inbound } = await this.inboundsService.findOne(id);
    if (inbound.status !== InboundStatus.COMPLETED) {
      throw new NotFoundException('PDF not yet generated for this inbound');
    }
    const buffer = await this.pdfService.renderWeegbonBuffer(inbound);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inbound.weegbonNr}.pdf"`,
    });
    res.send(buffer);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCALE_OPERATOR, UserRole.ADMIN)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.inboundsService.complete(id, userId);
  }
}
