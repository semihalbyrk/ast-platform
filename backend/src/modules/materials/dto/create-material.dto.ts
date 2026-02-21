import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { MaterialCategory } from '../../../common/enums';

export class CreateMaterialDto {
  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nameNl?: string;

  @IsEnum(MaterialCategory)
  category: MaterialCategory;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  unit?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
