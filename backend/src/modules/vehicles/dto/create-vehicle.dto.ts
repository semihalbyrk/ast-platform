import { IsString, IsEnum, IsOptional, IsInt, IsUUID, MaxLength } from 'class-validator';
import { VehicleType } from '../../../common/enums';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(20)
  licensePlate: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsUUID()
  @IsOptional()
  transporterId?: string;

  @IsInt()
  @IsOptional()
  tareWeight?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
