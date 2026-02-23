import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInboundWeighInDto {
  @IsUUID()
  @IsOptional()
  contractId?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  licensePlate?: string;

  @IsUUID()
  supplierId: string;

  @IsInt()
  @Min(1)
  grossWeight: number;

  @IsUUID()
  @IsOptional()
  materialId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  pricePerTon?: number;

  @IsUUID()
  @IsOptional()
  transporterId?: string;

  @IsString()
  @IsOptional()
  arrivalNotes?: string;
}
