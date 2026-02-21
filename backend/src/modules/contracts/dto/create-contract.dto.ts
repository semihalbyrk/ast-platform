import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ContractType, ContractStatus } from '../../../common/enums';

export class CreateContractDto {
  @IsString()
  @MaxLength(50)
  number: string;

  @IsEnum(ContractType)
  type: ContractType;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsUUID()
  entityId: string;

  @IsUUID()
  @IsOptional()
  ladenLossenId?: string | null;

  @IsUUID()
  materialId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  impDeduction?: number;

  @IsInt()
  @Min(0)
  agreedVolume: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @IsOptional()
  paymentTerms?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  termsOfDelivery?: string | null;

  @IsInt()
  @IsOptional()
  maxTruckloads?: number | null;

  @IsInt()
  @IsOptional()
  stdGewicht?: number | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
