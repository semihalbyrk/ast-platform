import { IsUUID, IsDateString, IsString, IsOptional, IsArray } from 'class-validator';

export class GeneratePurchaseOrderDto {
  @IsUUID()
  clientId: string;

  @IsDateString()
  @IsOptional()
  periodStart?: string;

  @IsDateString()
  @IsOptional()
  periodEnd?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  inboundIds?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
