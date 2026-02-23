import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { YardLocationsService } from './yard-locations.service';
import { CreateYardLocationDto } from './dto/create-yard-location.dto';
import { UpdateYardLocationDto } from './dto/update-yard-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('yard-locations')
@UseGuards(JwtAuthGuard)
export class YardLocationsController {
  constructor(private readonly yardLocationsService: YardLocationsService) {}

  @Get()
  async findAll(@Query('active') active?: string) {
    return this.yardLocationsService.findAll({
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.yardLocationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateYardLocationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.yardLocationsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateYardLocationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.yardLocationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.yardLocationsService.remove(id, userId);
  }
}
