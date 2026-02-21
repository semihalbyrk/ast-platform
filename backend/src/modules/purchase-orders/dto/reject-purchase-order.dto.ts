import { IsString, IsOptional } from 'class-validator';

export class RejectPurchaseOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
