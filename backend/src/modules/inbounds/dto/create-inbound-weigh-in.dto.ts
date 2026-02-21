import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInboundWeighInDto {
  @IsUUID()
  contractId: string;

  @IsUUID()
  vehicleId: string;

  @IsString()
  @MaxLength(20)
  licensePlate: string;

  @IsUUID()
  supplierId: string;

  @IsInt()
  @Min(1)
  grossWeight: number;

  @IsString()
  @IsOptional()
  arrivalNotes?: string;
}
