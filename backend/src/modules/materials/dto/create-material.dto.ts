import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { WeightUom } from '../../../common/enums';

export class CreateMaterialDto {
  @IsString()
  @MaxLength(20)
  @IsOptional()
  code?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsBoolean()
  @IsOptional()
  hazardous?: boolean;

  @IsEnum(WeightUom)
  @IsOptional()
  weightUom?: WeightUom;
}
