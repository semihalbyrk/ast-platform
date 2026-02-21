import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../../../common/enums';

class ContactPersonDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  role: string;
}

export class CreateEntityDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsArray()
  @IsEnum(EntityType, { each: true })
  type: EntityType[];

  @IsString()
  @IsOptional()
  @MaxLength(255)
  street?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vatNr?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  kvk?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  iban?: string;

  @IsInt()
  @IsOptional()
  paymentTerms?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactPersonDto)
  @IsOptional()
  contactPersons?: ContactPersonDto[];
}
