import { IsString, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator';

export class CreateYardLocationDto {
  @IsString()
  @MaxLength(20)
  @IsOptional()
  code?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
