import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';

export class GeneratePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
