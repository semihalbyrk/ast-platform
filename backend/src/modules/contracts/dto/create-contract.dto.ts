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
  @IsOptional()
  clientId?: string | null;

  @IsUUID()
  entityId: string;

  @IsUUID()
  @IsOptional()
  transporterId?: string | null;

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

  @IsString()
  @IsOptional()
  @MaxLength(255)
  termsOfDelivery?: string | null;

  @IsInt()
  @IsOptional()
  maxTruckloads?: number | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  freights?: number | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
