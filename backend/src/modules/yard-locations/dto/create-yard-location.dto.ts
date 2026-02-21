import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator';
import { LocationType } from '../../../common/enums';

export class CreateYardLocationDto {
  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(LocationType)
  type: LocationType;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
