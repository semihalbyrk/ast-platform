import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeighbridgeService } from './weighbridge.service';
import { RecordWeightDto } from './dto/record-weight.dto';

@Controller('webhooks/weighbridge')
export class WeighbridgeController {
  constructor(
    private readonly weighbridgeService: WeighbridgeService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async recordWeight(
    @Headers('x-webhook-secret') secret: string,
    @Body() dto: RecordWeightDto,
  ) {
    const expectedSecret = this.configService.get<string>('WEIGHBRIDGE_SECRET');
    if (!secret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing webhook secret');
    }

    return this.weighbridgeService.recordWeight(
      dto.weegbonNr,
      dto.weightKg,
      dto.weighingNumber,
      dto.timestamp,
    );
  }
}
